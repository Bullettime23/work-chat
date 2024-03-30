import { fetchRedis } from './redis';

export const getFriendsByUserId = async (userId: string) => {
	const friendsIds = (await fetchRedis('smembers', `user:${userId}:friends`)) as string[];
	const friends = await Promise.all(
		friendsIds.map(async (friendId) => {
			const friendIdRes = await fetchRedis('get', `user:${friendId}`);
			return JSON.parse(friendIdRes) as User;
		})
	);

	return friends;
};
