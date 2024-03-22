'use client';
import { db } from '@/lib/db';
import { signOut } from 'next-auth/react';

export default async function Home() {
	await db.set('Check', 'Checked!');

	return <button onClick={() => signOut()}>SignOut</button>;
}
