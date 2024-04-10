'use client';
import { signOut } from 'next-auth/react';

export default function Home() {
	return <button onClick={() => signOut()}>SignOut</button>;
}
