// INFO 360 classroom prototype. Login and payment are simulated; never enter real credentials.
const defaults = {
  signedIn:false, demoName:'UW Student', duration:2, location:'Central Plaza Garage',
  plate:'BGF4821 · Washington', credits:1000, useCredits:500, payment:'Visa •••• 4242',
  history:[
    {date:'NOV 12',location:'Central Plaza Garage',duration:2,total:5.85,discount:4.15,creditsUsed:0,status:'Completed'},
    {date:'NOV 10',location:'Padelford Garage',duration:4,total:10,discount:5,creditsUsed:500,status:'Completed'},
    {date:'NOV 9',location:'Central Plaza Garage',duration:3,total:10,discount:5,creditsUsed:500,status:'Completed'}
  ],activeSession:null
};
const stored = (() => { try { return JSON.parse(sessionStorage.getItem('uwParkingState')) || {}; } catch { return {}; } })();
const state = {...defaults,...stored};
const page = document.body.dataset.page;
const $ = id => document.getElementById(id);
const money = amount => '$' + Number(amount).toFixed(2);
const escapeHTML = s => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function save(){sessionStorage.setItem('uwParkingState',JSON.stringify(state));}
function go(destination){save();location.href=destination+'.html';}
function price(){
  const base=state.duration*5, discount=base*0.2;
  const credits=Math.min(state.credits,state.useCredits,Math.round((base-discount)*100));
  return {base,discount,credits,total:Math.max(0,base-discount-credits/100)};
}
function set(id,value){if($(id)) $(id).textContent=value;}
function draw(){
  switch(page){
    case 'overview':{
      set('creditCount',state.credits.toLocaleString()+' credits');
      set('creditAmount',money(state.credits/100)+' toward parking');
      const last=state.history[0];
      set('latestLocation',last.location); set('latestDetails',last.date+' · '+last.duration+' hours · Vehicle '+state.plate.split(' · ')[0]);
      set('latestPaid','Paid '+money(last.total));set('latestSaved','Saved '+money(last.discount));
      break;
    }
    case 'park':{
      set('locationText',state.location);set('vehicleText',state.plate);
      document.querySelectorAll('[data-duration]').forEach(b=>b.classList.toggle('selected',Number(b.dataset.duration)===state.duration));
      $('durationSelect').value=String(state.duration);
      const p=price();
      set('standardLabel','Standard rate · '+state.duration+' hours');set('standardAmount',money(p.base));
      set('discountAmount','−'+money(p.discount));set('beforeCredits',money(p.base-p.discount));break;
    }
    case 'review':{
      const p=price(); set('reviewLocation',state.location);
      $('reviewDetails').replaceChildren(document.createTextNode(state.plate),document.createElement('br'),document.createTextNode(state.duration+' hours · Starting now'));
      set('appliedCredits',p.credits+' credits applied');set('appliedCreditDollars','−'+money(p.credits/100));
      set('creditsDescription','Using '+money(p.credits/100)+' of your '+money(state.credits/100)+' balance.');
      set('remainingCredits',(state.credits-p.credits)+' credits will remain');
      set('reviewHours','Parking · '+state.duration+' hours');set('reviewBase',money(p.base));
      set('reviewDiscount','−'+money(p.discount));set('reviewCreditsLabel','Parking credits · '+p.credits);
      set('reviewCredits','−'+money(p.credits/100));set('reviewTotal',money(p.total));
      set('paymentLabel',state.payment);set('payButton','Pay '+money(p.total)+' & start parking');break;
    }
    case 'confirmation':{
      const s=state.activeSession;if(!s)return go('park');
      set('sessionEnds',s.end);set('sessionTime',s.duration+' hours · Started at '+s.start);
      set('sessionLocation',s.location);set('sessionVehicle',state.plate+' · '+s.duration+' hours');
      set('sessionReference',s.reference);set('paidMethod','Paid with '+state.payment);
      set('sessionPaid',money(s.total));set('sessionDiscount','−'+money(s.discount));
      set('sessionCreditsLabel','Credits used · '+s.credits);set('sessionCredits','−'+money(s.credits/100));
      set('balanceLeft',state.credits+' credits left in your balance');
      set('sessionReminder','Your session ends at '+s.end+'. Check this page before leaving your vehicle longer.');break;
    }
    case 'receipt':{
      const s=state.activeSession;if(!s)return go('park');
      set('receiptLocation',s.location);set('receiptReference','Reference '+s.reference+' · '+s.duration+' hours · '+s.start+'–'+s.end);
      set('receiptBase',money(s.base));set('receiptDiscount','−'+money(s.discount));
      set('receiptCredits','−'+money(s.credits/100));set('receiptPaid',money(s.total));break;
    }
    case 'activity':{
      set('totalPaid',money(state.history.reduce((n,r)=>n+r.total,0)));
      set('totalDiscount',money(state.history.reduce((n,r)=>n+r.discount,0)));
      set('totalCredits',money(state.history.reduce((n,r)=>n+r.creditsUsed/100,0)));
      set('visitCount',state.history.length+' visits recorded');
      $('historyList').innerHTML=state.history.map(r=>`<section class="record"><div class="between"><span class="eyebrow">${escapeHTML(r.date)}</span><strong class="small" style="color:var(--purple)">${money(r.total)}</strong></div><div class="record-title">${escapeHTML(r.location)}</div><div class="small muted">${r.duration} hours · ${escapeHTML(r.status)}</div><p class="small success">${money(r.discount)} discount${r.creditsUsed?' · '+money(r.creditsUsed/100)+' credits':''}</p></section>`).join('');
      break;
    }
  }
}
if (!state.signedIn && !['index','login'].includes(page)) go('login');
else {
  const footer=$('footer');
  footer.hidden=!state.signedIn || ['index','login'].includes(page);
  footer.querySelectorAll('[data-go]').forEach(b=>b.classList.toggle('active',b.dataset.go===(['review','confirmation','receipt'].includes(page)?'park':page)));
  draw();
}
document.addEventListener('click', e=>{
  const route=e.target.closest('[data-go]');if(route){go(route.dataset.go);return;}
  const duration=e.target.closest('[data-duration]');
  if(duration){state.duration=Number(duration.dataset.duration);save();draw();return;}
  const action=e.target.closest('[data-action]')?.dataset.action;if(!action)return;
  if(action==='location'){
    const result=prompt('Choose a garage:\n1 — Central Plaza Garage\n2 — Padelford Garage',state.location==='Central Plaza Garage'?'1':'2');
    if(['1','2'].includes(result)){state.location=result==='1'?'Central Plaza Garage':'Padelford Garage';save();draw();}
  } else if(action==='vehicle'){
    const result=prompt('Enter a DEMO vehicle plate (do not enter private information):',state.plate);
    if(result?.trim()){state.plate=result.trim().slice(0,40);save();draw();}
  } else if(action==='credits'){
    const result=prompt('How many credits would you like to use? (100 credits = $1)',String(state.useCredits));
    if(result!==null && /^\d+$/.test(result.trim())){state.useCredits=Math.min(Number(result),state.credits);save();draw();}
  } else if(action==='payment'){
    alert('This prototype uses a fake Visa ending in 4242. No payment details are collected.');
  } else if(action==='help'){
    alert('INFO 360 class concept only. For actual parking policies, contact UW Transportation Services.');
  } else if(action==='pay'){
    const p=price(),now=new Date(),end=new Date(now.getTime()+state.duration*3600000);
    const format=d=>d.toLocaleTimeString('en-US',{hour:'numeric',minute:'2-digit'});
    const s={location:state.location,duration:state.duration,base:p.base,discount:p.discount,credits:p.credits,total:p.total,start:format(now),end:format(end),reference:'DEMO-'+Math.floor(Math.random()*90000+10000)};
    state.credits-=p.credits;state.activeSession=s;
    state.history.unshift({date:'TODAY',location:s.location,duration:s.duration,total:s.total,discount:s.discount,creditsUsed:s.credits,status:'Active'});
    go('confirmation');
  }
});
$('durationSelect')?.addEventListener('change',e=>{state.duration=Number(e.target.value);save();draw();});
$('loginForm')?.addEventListener('submit',e=>{
  e.preventDefault();const name=$('demoId').value.trim();if(!name)return;
  state.demoName=name;state.signedIn=true;go('overview');
});
