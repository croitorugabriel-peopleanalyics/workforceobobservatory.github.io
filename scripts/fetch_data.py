import json, urllib.request, urllib.parse, datetime, pathlib, math
ROOT=pathlib.Path(__file__).resolve().parents[1]
CFG=json.loads((ROOT/'config.json').read_text())
OUT=ROOT/'data'/'dashboard.json'

def get_json(url):
    req=urllib.request.Request(url,headers={'User-Agent':'WorkforceObservatory/1.0 public-data-dashboard'})
    with urllib.request.urlopen(req,timeout=45) as r: return json.load(r)

def wb_fetch(code,label):
    countries=';'.join(CFG['countries'])
    url=f'https://api.worldbank.org/v2/country/{countries}/indicator/{code}?format=json&per_page=20000'
    payload=get_json(url)
    rows=[]
    if isinstance(payload,list) and len(payload)>1 and payload[1]:
      for x in payload[1]:
        if x.get('value') is None: continue
        rows.append({'source':'World Bank','indicator':code,'label':label,'country':x['countryiso3code'],'country_name':x['country']['value'],'year':str(x['date']),'value':x['value'],'unit':'%' if '%' in label else 'value','source_url':'https://data.worldbank.org/indicator/'+code})
    return rows

def latest_by_country(rows):
    out={}
    for r in rows:
      k=(r['country'],r['indicator'])
      if k not in out or r['year']>out[k]['year']: out[k]=r
    return list(out.values())

def score(latest):
    by={}
    for r in latest: by.setdefault(r['country'],{})[r['indicator']]=r
    result=[]
    for c,m in by.items():
      emp=m.get('SL.EMP.TOTL.SP.ZS',{}).get('value')
      un=m.get('SL.UEM.TOTL.ZS',{}).get('value')
      part=m.get('SL.TLF.CACT.ZS',{}).get('value')
      youth=m.get('SL.UEM.1524.ZS',{}).get('value')
      vuln=m.get('SL.EMP.VULN.ZS',{}).get('value')
      components={
       'employment_strength': emp,
       'unemployment_health': None if un is None else max(0,100-un*7),
       'participation': part,
       'youth_health': None if youth is None else max(0,100-youth*3),
       'job_stability': None if vuln is None else max(0,100-vuln*2)
      }
      available=[v for v in components.values() if v is not None]
      whi=sum(available)/len(available) if available else None
      result.append({'country':c,'country_name':next(iter(m.values()))['country_name'],'score':round(whi,1) if whi is not None else None,'components':components,'coverage':len(available)/5})
    return result

def main():
    observations=[]; errors=[]
    for code,label in CFG['world_bank_indicators'].items():
      try: observations.extend(wb_fetch(code,label))
      except Exception as e: errors.append({'source':'World Bank','indicator':code,'error':str(e)})
    existing={}
    if OUT.exists():
      try: existing=json.loads(OUT.read_text())
      except: pass
    if not observations and existing.get('observations'):
      existing['refresh_status']='fallback_previous_data'; existing['refresh_errors']=errors; existing['attempted_at']=datetime.datetime.now(datetime.timezone.utc).isoformat(); OUT.write_text(json.dumps(existing,indent=2),encoding='utf-8'); return
    latest=latest_by_country(observations)
    data={'generated_at':datetime.datetime.now(datetime.timezone.utc).isoformat(),'refresh_status':'success' if not errors else 'partial_success','refresh_errors':errors,'methodology':{'name':'Workforce Health Index (experimental)','note':'Composite macro indicator for exploration. It is not an official statistic or company-level HR score. Missing components are excluded from the country average.','components':['employment_strength','unemployment_health','participation','youth_health','job_stability']},'sources':[{'name':'World Bank Indicators API','url':'https://api.worldbank.org/v2/','license_note':'Review publisher terms and attribution.'},{'name':'Eurostat Statistics API','url':'https://ec.europa.eu/eurostat/api/dissemination/statistics/1.0/data/','status':'adapter documented; curated datasets can be added in config'},{'name':'OECD SDMX API','url':'https://sdmx.oecd.org/public/rest/','status':'adapter documented; dataset structure must be pinned'},{'name':'ILOSTAT Bulk Download','url':'https://rplumber.ilo.org/data/indicator/','status':'adapter documented; large bulk files best processed in CI'}],'observations':observations,'latest':latest,'workforce_health_index':score(latest),'company_data':{'status':'not_included','reason':'There is no single standardized public API covering comparable company-level HR metrics. Add source-specific adapters for regulatory filings or company sustainability reports, with explicit provenance.'}}
    OUT.write_text(json.dumps(data,indent=2),encoding='utf-8')
if __name__=='__main__': main()
