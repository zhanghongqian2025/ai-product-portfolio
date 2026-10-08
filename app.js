'use strict';
const $ = (s) => document.querySelector(s);
const esc = (v = '') => String(v).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const external = (url) => { try { const u = new URL(url); return u.protocol === 'https:' ? u.href : null; } catch { return null; } };
const localAsset = (path) => typeof path === 'string' && /^assets\/[a-zA-Z0-9/_\.\-]+$/.test(path) && !path.includes('..') ? path : '';
const typeNames = {platform:'平台',agent:'智能体集',app:'移动应用',miniprogram:'微信小程序',website:'官网',solution:'解决方案',product:'AI 产品'};
let data, companyFilter = 'all', typeFilter = 'all', search = '', gallery = [], imageIndex = 0, lastImageTrigger;
const lightbox = $('#lightbox');
function status(item) { return `<span class="status ${esc(item.statusTone || '')}">${esc(item.statusLabel)}</span>`; }
function asset(item) { return item.media?.filter(m => localAsset(m.file)) || []; }
function mediaMarkup(item) {
  const images = asset(item);
  if (item.type === 'miniprogram') return `<div class="mini-visual"><span>WEIXIN MINI PROGRAM</span><strong>包晴天<br>微信小程序</strong><small>微信法律服务入口 · 此处为文字展示，非界面截图</small></div>`;
  if (images.length && item.type === 'app') return `<div class="card-media apps ${item.id.includes('lawyer') ? 'lawyer' : ''}">${images.slice(0,2).map(m => `<img src="${esc(m.file)}" alt="${esc(m.title)}" loading="lazy" width="600" height="1300">`).join('')}<span class="media-label">官方 App Store 产品图</span></div>`;
  if (images.length) return `<div class="card-media website"><img src="${esc(images[0].file)}" alt="${esc(images[0].title)}" loading="lazy" width="1280" height="720"><span class="media-label">${item.mediaKind === 'product-ui' ? '产品页面 · 实际截图' : '官方介绍页 · 实际截图'}</span></div>`;
  return `<div class="agent-visual"><span class="visual-index">${esc(item.visualLabel || typeNames[item.type])}</span><strong>${esc(item.visualTitle || item.title)}</strong><small>${item.pending ? '素材待补 · 此处为视觉占位' : '场景索引 · 此处为文字示意，非产品界面'}</small></div>`;
}
function wechatMarkup(item) {
  if (item.type !== 'miniprogram') return '';
  return `<section class="wechat-access"><h2>在微信中打开</h2><p>复制小程序链接，粘贴到微信后打开包晴天。</p><code class="wechat-share-code">${esc(item.wechatShareCode || '')}</code><button class="button wechat-copy" type="button">复制小程序链接 <span>↗</span></button><p class="wechat-copy-status" role="status" aria-live="polite"></p><small>也可在微信的发现页面进入小程序，搜索“${esc(item.wechatName)}”。</small></section>`;
}
function card(item) {
  return `<article class="project-card ${item.pending ? 'pending-card' : ''}" data-project="${esc(item.id)}"><a href="#work/${esc(item.id)}" aria-label="查看${esc(item.title)}详情">${mediaMarkup(item)}</a><div class="card-body"><div class="card-meta"><span class="card-type">${esc(typeNames[item.type])}</span>${status(item)}</div><h3 class="card-title"><a href="#work/${esc(item.id)}">${esc(item.title)}</a></h3><p class="card-description">${esc(item.summary)}</p><div class="card-footer"><span>${esc(item.cardNote)}</span><a href="#work/${esc(item.id)}" aria-label="查看${esc(item.title)}详情">查看详情 <span aria-hidden="true">↗</span></a></div></div></article>`;
}
function renderCollection() {
  const list = data.projects.filter(p => (companyFilter === 'all' || p.company === companyFilter) && (typeFilter === 'all' || p.type === typeFilter) && (!search || `${p.title} ${p.summary} ${p.audience || ''} ${p.keywords || ''}`.toLowerCase().includes(search.toLowerCase())));
  $('#result-label').textContent = `${companyFilter === 'all' ? '全部公司' : data.companies.find(c => c.id === companyFilter).name} · ${list.length} 项成果`;
  $('#reset-filters').hidden = companyFilter === 'all' && typeFilter === 'all' && !search;
  $('#empty-state').hidden = list.length > 0;
  $('#collection').innerHTML = data.companies.map((c,i) => {
    const items = list.filter(p => p.company === c.id);
    if (!items.length) return '';
    const main = items.filter(p => !p.parent), agents = items.filter(p => p.parent);
    return `<section class="company-block" aria-labelledby="company-${esc(c.id)}"><div class="company-heading"><span class="company-number">0${i+1}</span><h3 id="company-${esc(c.id)}">${esc(c.name)}</h3><p>${esc(c.shortIntro)}</p></div>${c.productDelivery ? `<p class="company-contribution">${esc(c.productDelivery)}</p>` : ''}${c.achievement ? `<div class="company-achievement"><strong>${esc(c.achievement.value)}<small>${esc(c.achievement.unit)}</small></strong><div><h4>${esc(c.achievement.label)}</h4><p>${esc(c.achievement.description)}</p></div></div>` : ''}${main.length ? `<div class="project-grid">${main.map(card).join('')}</div>` : ''}${agents.length ? `<div class="project-grid">${agents.map(card).join('')}</div>` : ''}</section>`;
  }).join('');
  document.querySelectorAll('#company-filters button').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.company === companyFilter)));
}
function resetFilters() { companyFilter = 'all'; typeFilter = 'all'; search = ''; $('#type-filter').value = 'all'; $('#search').value = ''; renderCollection(); }
function storeMarkup(item) {
  const stores = (item.storeLinks || []).filter(s => external(s.url));
  if (!stores.length) return '';
  return `<section class="android-stores" aria-label="安卓应用商店"><h2>安卓应用商店</h2><div class="store-list">${stores.map(s => `<a class="store-row" href="${esc(external(s.url))}" target="_blank" rel="noopener noreferrer"><span><strong>${esc(s.name)}</strong><small>${esc(s.note)}</small></span><span class="store-action">${s.kind === 'detail' ? '应用详情' : '商店入口'} ↗</span></a>`).join('')}</div><p class="store-note">${esc(item.storeNote)}</p></section>`;
}
function agentExamplesMarkup(item) {
  if (!item.agentExamples?.length) return '';
  return `<section class="agent-examples"><h2>代表智能体</h2><div class="agent-example-grid">${item.agentExamples.map(a => `<article class="agent-example"><h3>${esc(a.title)}</h3><p>${esc(a.description)}</p><dl><dt>输入</dt><dd>${esc(a.input)}</dd><dt>输出</dt><dd>${esc(a.output)}</dd></dl>${external(a.url) ? `<a href="${esc(external(a.url))}" target="_blank" rel="noopener noreferrer">${a.url.includes('/intro/') ? '查看智能体介绍' : '在平台查看'} ↗</a>` : ''}</article>`).join('')}</div></section>`;
}
function platformCollectionsMarkup(item) {
  if (!item.platformCollections?.length) return '';
  return `<section class="platform-collections"><h2>平台场景智能体集</h2><p>按目的地与业务场景组织专业能力，进入集合后匹配该场景内的智能体。</p><div class="platform-collection-grid">${item.platformCollections.map(c => `<article><h3>${esc(c.title)}</h3><p>${esc(c.description)}</p><a href="${esc(external(c.url))}" target="_blank" rel="noopener noreferrer">在平台查看 ↗</a></article>`).join('')}</div></section>`;
}
function renderDetail(item) {
  const company = data.companies.find(c => c.id === item.company), images = asset(item), children = data.projects.filter(p => p.parent === item.id);
  const links = (item.links || []).filter(l => external(l.url));
  const blocks = [['使用者与问题',item.problem],['产品方案',item.solution]];
  const contribution = [company.productDelivery, ...(Array.isArray(item.publicContribution) ? item.publicContribution : [item.publicContribution])].filter(Boolean);
  if (contribution.length) blocks.push(['我的负责范围',contribution]);
  if (item.accessNotes) blocks.push(['使用方式',item.accessNotes]);
  const related = (item.relatedIds || []).map(id => data.projects.find(p => p.id === id)).filter(Boolean);
  $('#detail-view').innerHTML = `<a href="#works" class="detail-back">← 返回成果作品</a><div class="detail-top ${!links.length ? 'without-entry' : ''}"><div><p class="detail-kicker">${esc(company.name)} / ${esc(typeNames[item.type])}${item.parent ? ' / 百鉴平台下的智能体集' : ''}</p><h1 id="detail-title" tabindex="-1">${esc(item.title)}</h1><p class="detail-lead">${esc(item.summary)}</p>${storeMarkup(item)}${wechatMarkup(item)}</div>${links.length ? `<aside class="detail-state" aria-label="产品入口"><p class="state-name">产品入口</p>${status(item)}<div class="detail-actions">${links.map(l => `<a class="button primary" href="${esc(external(l.url))}" target="_blank" rel="noopener noreferrer">${esc(l.label)} <span>↗</span></a>`).join('')}</div></aside>` : ''}</div><div class="detail-grid public-detail-grid"><div class="detail-content">${blocks.map(([title,body]) => `<section><h2>${title}</h2>${Array.isArray(body) ? `<ul>${body.map(t => `<li>${esc(t)}</li>`).join('')}</ul>` : `<p>${esc(body)}</p>`}</section>`).join('')}${agentExamplesMarkup(item)}${platformCollectionsMarkup(item)}${images.length ? `<section><h2>产品展示</h2><p>点击图片查看大图</p><div class="detail-gallery">${images.map((m,i) => `<figure class="media-item ${item.type !== 'app' ? 'wide' : ''}"><button data-image-index="${i}" aria-label="放大${esc(m.title)}"><img src="${esc(m.file)}" alt="${esc(m.title)}" loading="lazy"></button><figcaption>${esc(m.title)}</figcaption></figure>`).join('')}</div></section>` : ''}${children.length ? `<section><h2>平台下的智能体集</h2><div class="related-links">${children.map(c => `<a href="#work/${esc(c.id)}">${esc(c.title)} ↗</a>`).join('')}</div></section>` : ''}${related.length ? `<section><h2>相关成果</h2><div class="related-links">${related.map(p => `<a href="#work/${esc(p.id)}">${esc(p.title)} ↗</a>`).join('')}</div></section>` : ''}</div></div>`;
  $('#detail-view').querySelectorAll('[data-image-index]').forEach(b => b.addEventListener('click', () => {
    gallery = images; imageIndex = Number(b.dataset.imageIndex); lastImageTrigger = b; updateLightbox(); lightbox.showModal();
  }));
  const copyButton = $('#detail-view').querySelector('.wechat-copy');
  if (copyButton) copyButton.addEventListener('click', async () => {
    const message = $('#detail-view').querySelector('.wechat-copy-status');
    try { await navigator.clipboard.writeText(item.wechatShareCode); message.textContent = '已复制，粘贴到微信打开'; }
    catch { message.textContent = '复制未成功，请选中上方链接手动复制到微信'; }
  });
  document.title = `${item.title} 张洪千作品集`;
}
function route() {
  if (!data) return;
  if (lightbox.open) lightbox.close();
  const match = /^#work\/([a-zA-Z0-9-]+)$/.exec(location.hash);
  const item = match && data.projects.find(p => p.id === match[1]);
  if (match && !item) { $('#home-view').hidden = true; $('#detail-view').hidden = false; $('#detail-view').innerHTML = '<a href="#works" class="detail-back">← 返回成果作品</a><h1>这项成果尚未收录</h1><p class="detail-lead">请返回清单查看已收录的作品。</p>'; document.title='成果未收录 张洪千作品集'; window.scrollTo(0,0); return; }
  $('#home-view').hidden = Boolean(item); $('#detail-view').hidden = !item;
  if (item) { renderDetail(item); window.scrollTo({top:0,behavior:'instant'}); $('#detail-title').focus({preventScroll:true}); }
  else { document.title='张洪千 AI 产品与交付作品集'; const target = document.getElementById(location.hash.slice(1)); if (target) requestAnimationFrame(()=>target.scrollIntoView()); }
}
function updateLightbox() {
  const m = gallery[imageIndex]; $('#lightbox-img').src = localAsset(m.file); $('#lightbox-img').alt = m.title; $('#lightbox-title').textContent = m.title;
  $('#lightbox-caption').textContent = `${imageIndex+1} / ${gallery.length}`;
  $('#prev-image').disabled = imageIndex===0; $('#next-image').disabled = imageIndex===gallery.length-1;
}
$('#lightbox-close').addEventListener('click',()=>lightbox.close());
lightbox.addEventListener('close',()=>{lastImageTrigger?.focus({preventScroll:true});});
lightbox.addEventListener('click',e=>{if(e.target===lightbox){const r=lightbox.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)lightbox.close();}});
$('#prev-image').addEventListener('click',()=>{if(imageIndex>0){imageIndex--;updateLightbox();}});
$('#next-image').addEventListener('click',()=>{if(imageIndex<gallery.length-1){imageIndex++;updateLightbox();}});
lightbox.addEventListener('keydown',e=>{if(e.key==='ArrowLeft'&&imageIndex>0){imageIndex--;updateLightbox();}if(e.key==='ArrowRight'&&imageIndex<gallery.length-1){imageIndex++;updateLightbox();}});
$('#reload').addEventListener('click',()=>location.reload());
async function init() {
  try {
    const res = await fetch('data/portfolio.json'); if(!res.ok) throw new Error('Content unavailable'); data = await res.json();
    $('#company-filters').innerHTML = [{id:'all',name:'全部作品'},...data.companies].map(c=>`<button data-company="${esc(c.id)}" aria-pressed="${c.id==='all'}">${esc(c.name)}</button>`).join('');
    $('#company-filters').addEventListener('click',e=>{const b=e.target.closest('button[data-company]');if(b){companyFilter=b.dataset.company;renderCollection();}});
    $('#type-filter').addEventListener('change',e=>{typeFilter=e.target.value;renderCollection();});
    $('#search').addEventListener('input',e=>{search=e.target.value.trim();renderCollection();});
    $('#reset-filters').addEventListener('click',resetFilters);$('#empty-reset').addEventListener('click',resetFilters);
    renderCollection();route(); window.addEventListener('hashchange',route);
  } catch(e) { $('#home-view').hidden=true;$('#load-error').hidden=false;console.error('作品集内容加载失败，请检查本地数据文件。',e.message); }
}
init();
