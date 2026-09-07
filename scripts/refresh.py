from pathlib import Path
import json, urllib.request, datetime, time
ROOT=Path(__file__).resolve().parents[1]
CFG=json.loads((ROOT/'config.json').read_text(encoding='utf-8'))
OUT=ROOT/'data'/'dashboard.json'

def get(url,retries=3):
    last=None
    for attempt in range(retries):
        try:
            req=urllib.request.Request(url,headers={'User-Agent':'WorkforceObservatory/1.0'})
            with urllib.request.urlopen(req,timeout=60) as r:return json.load(r)
        except Exception as e:
            last=e; time.sleep(2**attempt)
    raise last

def latest(rows):
    out={}
    for r in rows:
        k=(r['country'],r['indicator'])
        if k not in out or int(r['year'])>int(out[k]['year']):out[k]=r
    return list(out.values())

def clamp(x):return max(0,min(100,x))
def whi(latest_rows):
    by={}
    for r in latest_rows:by.setdefault(r['country'],{})[r['indicator']]=r
    result=[]
    for country,m in by.items():
        val=lambda c:m.get(c,{}).get('value')
        emp,un,part,youth,vuln=val('SL.EMP.TOTL.SP.ZS'),val('SL.UEM.TOTL.ZS'),val('SL.TLF.CACT.ZS'),val('SL.UEM.1524.ZS'),val('SL.EMP.VULN.ZS')
        components={'employment_strength':emp,'unemployment_health':None if un is None else clamp(100-un*7),'participation':part,'youth_health':None if youth is None else clamp(100-youth*3),'job_stability':None if vuln is None else clamp(100-vuln*2)}
        available=[v for v in components.values() if v is not None]
        result.append({'country':country,'country_name':next(iter(m.values()))['country_name'],'score':round(sum(available)/len(available),1) if available else None,'coverage':round(len(available)/5,2),'components':components})
    return result

def main():
    observations=[]; errors=[]
    country_ids=';'.join(CFG['countries'])
    for code,meta in CFG['indicators'].items():
        try:
            payload=get(f'https://api.worldbank.org/v2/country/{country_ids}/indicator/{code}?format=json&per_page=20000')
            for x in (payload[1] if isinstance(payload,list) and len(payload)>1 and payload[1] else []):
                if x.get('value') is None or not x.get('countryiso3code'):continue
                observations.append({'source':'World Bank Indicators API','source_url':f'https://data.worldbank.org/indicator/{code}','indicator':code,'label':meta['label'],'unit':meta['unit'],'country':x['countryiso3code'],'country_name':x['country']['value'],'year':str(x['date']),'value':x['value']})
        except Exception as e:errors.append({'indicator':code,'error':str(e)})
    previous={}
    if OUT.exists():
        try:previous=json.loads(OUT.read_text(encoding='utf-8'))
        except Exception:pass
    now=datetime.datetime.now(datetime.timezone.utc).isoformat()
    if not observations:
        if previous:
            previous.update({'refresh_status':'fallback_previous_data','attempted_at':now,'refresh_errors':errors})
            OUT.write_text(json.dumps(previous,indent=2),encoding='utf-8');return
        raise RuntimeError('No observations retrieved and no fallback dataset exists')
    last=latest(observations)
    payload={'generated_at':now,'refresh_status':'success' if not errors else 'partial_success','refresh_errors':errors,'observations':observations,'latest':last,'workforce_health_index':whi(last),'methodology':{'name':'Experimental Macro Workforce Health Index','official':False,'note':'Exploratory composite. It is not an official statistic and not a company-level HR score. Missing components are excluded and coverage is displayed.','components':['employment_strength','unemployment_health','participation','youth_health','job_stability']},'sources':[{'name':'World Bank Indicators API','url':'https://api.worldbank.org/v2/','status':'active'},{'name':'Eurostat Statistics API','url':'https://ec.europa.eu/eurostat/api/dissemination/statistics/1.0/data/','status':'planned adapter'},{'name':'OECD Data Explorer API','url':'https://sdmx.oecd.org/public/rest/','status':'planned adapter'},{'name':'ILOSTAT Bulk Download','url':'https://rplumber.ilo.org/data/indicator/','status':'planned adapter'}]}
    OUT.write_text(json.dumps(payload,indent=2),encoding='utf-8')
if __name__=='__main__':main()
