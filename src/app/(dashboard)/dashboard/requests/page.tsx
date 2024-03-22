import FriendRequest from '@/components/FriendRequest';
import { fetchRedis } from '@/helpers/redis';
import { authOptions } from '@/lib/auth';
import { getServerSession } from 'next-auth';
import { notFound } from 'next/navigation';
import { FC } from 'react';

const page: FC = async () => {
	const session = await getServerSession(authOptions);
	if (!session) notFound();

	const incomingSenderIds = (await fetchRedis(
		'smembers',
		`user:${session.user.id}:incoming_friend_request`
	)) as string[];

	// const singleRequest = JSON.parse(await fetchRedis('get', `user:${incomingSenderIds[0]}`));
	// const incomingFriendRequests = [{ senderId: singleRequest.id, senderEmail: singleRequest.email }];
	const incomingFriendRequests = await Promise.all(
		incomingSenderIds.map(async (senderId) => {
			const sender = (await fetchRedis('get', `user:${senderId}`)) as string;
			const senderParsed = JSON.parse(sender) as User;

			return {
				senderId,
				senderEmail: senderParsed.email,
			};
		})
	);

	return (
		<main className="pt-8">
			<h1 className="font-bold text-5xl bm-8">Add a friend</h1>
			<div className="flex flex-col gap-4">
				<FriendRequest incomingFriendRequests={incomingFriendRequests} sessionId={session.user.id} />
			</div>
		</main>
	);
};

export default page;
