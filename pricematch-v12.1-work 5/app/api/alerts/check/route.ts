import { NextResponse } from "next/server";
import { db } from "../../../../lib/db";
import { searchAll } from "../../../../lib/search";
import { persistSearch } from "../../../../lib/history";

function authorized(req:Request){const secret=process.env.CRON_SECRET;return !secret || req.headers.get("authorization")===`Bearer ${secret}`;}
export async function POST(req:Request){
  if(!authorized(req)) return NextResponse.json({error:"Unauthorized"},{status:401});
  const watches=await db.watchlistItem.findMany({where:{active:true,userId:{not:null}},include:{user:true,product:{include:{identifiers:true,offers:true}}},take:100});
  let checked=0,triggered=0,errors=0;
  for(const w of watches){try{
    const ids=Object.fromEntries(w.product.identifiers.map(i=>[i.type,i.value]));
    const input:any={query:w.product.title,upc:ids.upc,gtin:ids.gtin,asin:ids.asin,model:ids.model};
    const result=await searchAll(input); await persistSearch(result);
    const lowest=Math.min(...result.offers.map(o=>o.price+(o.shipping??0)),Infinity);
    await db.watchlistItem.update({where:{id:w.id},data:{lastCheckedAt:new Date()}}); checked++;
    if(w.targetPrice!=null && lowest<=w.targetPrice && (w.lastAlertedPrice==null || lowest < w.lastAlertedPrice)){
      const subject=`Price drop: ${w.product.title}`;
      const message=`${w.product.title} is now $${lowest.toFixed(2)}, at or below your target of $${w.targetPrice.toFixed(2)}.`;
      const channel=process.env.RESEND_API_KEY?"email":"log";
      let status="logged";
      if(process.env.RESEND_API_KEY && w.user?.email){
        const r=await fetch("https://api.resend.com/emails",{method:"POST",headers:{Authorization:`Bearer ${process.env.RESEND_API_KEY}`,"Content-Type":"application/json"},body:JSON.stringify({from:process.env.ALERT_FROM_EMAIL||"PriceMatch Alerts <alerts@example.com>",to:[w.user.email],subject,text:message})}); status=r.ok?"sent":"failed";
      }
      await db.notificationLog.create({data:{userId:w.user!.id,watchlistItemId:w.id,channel,status,subject,message}});
      await db.watchlistItem.update({where:{id:w.id},data:{lastAlertedPrice:lowest}}); triggered++;
    }
  }catch{errors++;}
  }
  return NextResponse.json({checked,triggered,errors,ranAt:new Date().toISOString()});
}
