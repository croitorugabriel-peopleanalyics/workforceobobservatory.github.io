from pathlib import Path
from datetime import datetime,timezone
import json,os,shutil
r=Path(__file__).resolve().parents[1];d=r/'dist'
shutil.rmtree(d,ignore_errors=True);d.mkdir();shutil.copytree(r/'assets',d/'assets')
now=datetime.fromisoformat(os.getenv('BUILD_TIME_UTC',datetime.now(timezone.utc).isoformat()).replace('Z','+00:00'))
live=[]
for a in json.loads((r/'schedule.json').read_text()):
 if datetime.fromisoformat(a['publishAt'].replace('Z','+00:00'))<=now:
  (d/'articles').mkdir(exist_ok=True);shutil.copy2(r/'content'/f"{a['slug']}.html",d/'articles'/f"{a['slug']}.html");live.append(a)
cards=''.join('<a class=card href=articles/'+a['slug']+'.html><div class=ey>'+a['eyebrow']+'</div><h2>'+a['title']+'</h2><p>'+a['desc']+'</p><b>'+str(a['mins'])+' min read</b></a>' for a in live) or '<div class=card><h2>Next deep dive coming soon.</h2><p>Articles appear automatically after their scheduled LinkedIn publication.</p></div>'
page='<!doctype html><html lang=en><head><meta charset=utf-8><meta name=viewport content="width=device-width,initial-scale=1"><title>Insights | Workforce Observatory</title><link rel=stylesheet href=assets/site.css></head><body><header class=top><nav><b class=brand>WORKFORCE<span>OBSERVATORY</span></b></nav></header><section class=index><div><div class=ey>Research · Frameworks · Interactive explainers</div><h1>Build workforce decisions on foundations you can explain.</h1><p class=lead>Extended English editions of the visual People Analytics series published on LinkedIn.</p></div></section><main class=grid>'+cards+'</main><footer>Workforce Observatory · © Gabriel Croitoru</footer></body></html>'
(d/'index.html').write_text(page);(d/'.nojekyll').write_text('');print('published',len(live))
