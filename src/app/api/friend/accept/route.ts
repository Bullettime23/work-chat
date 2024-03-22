import { fetchRedis } from '@/helpers/redis';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
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

		await db.sadd(`user:${session.user.id}:friends`, idToAdd);
		await db.sadd(`user:${idToAdd}:friends`, session.user.id);

		// await db.srem(`user:${idToAdd}:outbound_incoming_friend_request`, session.user.id);
		await db.srem(`user:${session.user.id}:incoming_friend_request`, idToAdd);
		return new Response('OK');
	} catch (err) {
		console.log('Server error ', err);

		if (err instanceof z.ZodError) {
			return new Response('Invalid response payload', { status: 422 });
		}

		return new Response('Invalid request', { status: 400 });
	}
}
