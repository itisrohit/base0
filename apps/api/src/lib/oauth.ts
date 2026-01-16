import { GitHub } from 'arctic';

if (!process.env.GITHUB_CLIENT_ID || !process.env.GITHUB_CLIENT_SECRET) {
  console.warn('Missing GITHUB_CLIENT_ID or GITHUB_CLIENT_SECRET. OAuth will not work.');
}

export const github = new GitHub(
  process.env.GITHUB_CLIENT_ID || 'dummy',
  process.env.GITHUB_CLIENT_SECRET || 'dummy',
  null, // redirect URI is handled per request or omitted if optional in constructor (v3 passes it in createAuthorizationURL)
);
