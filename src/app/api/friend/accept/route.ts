import { fetchRedis } from '@/helpers/redis';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { pusherServer } from '@/lib/pusher';
import { toPusherKey } from '@/lib/utils';
import { getServerSession } from 'next-auth';
import { z } from 'zod';

export async function POST(req: Request) {
	try {
		const body = await req.json();

		const { id: idToAdd } = z.object({ id: z.string() }).parse(body);
		const session = await getServerSession(authOptions);

		if (!session) {
			return new Response('Unothorized', { status: 401 });
		}

		// both not friends allready
		const areAlreadyFriends = await fetchRedis('sismember', `user:${session.user.id}:friends`, idToAdd);

		if (areAlreadyFriends) {
			return new Response('Already friends', { status: 400 });
		}

		const hasFriendRequest = await fetchRedis(
			'sismember',
			`user:${session.user.id}:incoming_friend_request`,
			idToAdd
		);

		if (!hasFriendRequest) {
			return new Response('No friend request', { status: 400 });
		}

		const [userRaw, friendRaw] = (await Promise.all([
			fetchRedis('get', `user:${session.user.id}`),
			fetchRedis('get', `user:${idToAdd}`),
		])) as [string, string];

		const user = JSON.parse(userRaw) as User;
		const friend = JSON.parse(friendRaw) as User;

		//notify added user`
		await Promise.all([
			pusherServer.trigger(toPusherKey(`user:${idToAdd}:friends`), 'new_friend', user),
			pusherServer.trigger(toPusherKey(`user:${session.user.id}:friends`), 'new_friend', friend),
			db.sadd(`user:${session.user.id}:friends`, idToAdd),
			db.sadd(`user:${idToAdd}:friends`, session.user.id),
			// await db.srem(`user:${idToAdd}:outbound_incoming_friend_request`, session.user.id);
			db.srem(`user:${session.user.id}:incoming_friend_request`, idToAdd),
		]);
		return new Response('OK');
	} catch (err) {
		console.log('Server error ', err);

		if (err instanceof z.ZodError) {
			return new Response('Invalid response payload', { status: 422 });
		}

		return new Response('Invalid request', { status: 400 });
	}
}
