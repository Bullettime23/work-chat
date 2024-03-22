'use client';

import { SessionProvider } from 'next-auth/react';
import { ScriptProps } from 'next/script';
import { FC, ReactNode } from 'react';
import { Toaster } from 'react-hot-toast';

interface ProvidersProps {
	children: ReactNode;
}

const Providers: FC<ProvidersProps> = (props: ScriptProps) => {
	return (
		<SessionProvider>
			<Toaster position="top-center" reverseOrder={false} />
			{props.children}
		</SessionProvider>
	);
};

export default Providers;
