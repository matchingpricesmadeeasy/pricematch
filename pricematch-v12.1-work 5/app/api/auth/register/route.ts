import { NextResponse } from "next/server";
import { db } from "../../../../lib/db";
import { createSession, hashPassword, normalizeEmail } from "../../../../lib/auth";
export async function POST(req: Request) {
  try { const { email, password } = await req.json(); const e=normalizeEmail(email||"");
    if (!/^\S+@\S+\.\S+$/.test(e)) return NextResponse.json({error:"Enter a valid email."},{status:400});
    if (typeof password!=="string" || password.length<8) return NextResponse.json({error:"Password must be at least 8 characters."},{status:400});
    if (await db.user.findUnique({where:{email:e}})) return NextResponse.json({error:"An account with that email already exists."},{status:409});
    const user=await db.user.create({data:{email:e,passwordHash:hashPassword(password)}}); await createSession(user.id);
    return NextResponse.json({user:{id:user.id,email:user.email}});
  } catch { return NextResponse.json({error:"Unable to create account."},{status:500}); }
}
