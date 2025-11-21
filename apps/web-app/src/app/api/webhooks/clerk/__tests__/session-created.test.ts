import type { SessionWebhookEvent } from '@clerk/nextjs/server';
import { db } from '@seawatts/db/client';
import { Users } from '@seawatts/db/schema';
import { eq } from 'drizzle-orm';
import { handleSessionCreated } from '../session-created';

describe('handleSessionCreated', () => {
  it('should update lastLoggedInAt for the user', async () => {
    const userId = 'user_29w83sxmDNGwOuEthce5gg56FcC';
    await db.insert(Users).values({
      avatarUrl: 'https://img.clerk.com/xxxxxx',
      clerkId: userId,
      email: 'example@example.org',
      firstName: 'Example',
      id: userId,
      lastName: 'Example',
    });

    const event = {
      data: {
        abandon_at: 0,
        actor: {
          id: userId,
        },
        client_id: 'client_123',
        created_at: 0,
        expire_at: 0,
        id: 'sess_123',
        last_active_at: 0,
        object: 'session' as const,
        status: 'active',
        updated_at: 0,
        user: {
          backup_code_enabled: false,
          banned: false,
          create_organization_enabled: false,
          create_organizations_limit: null,
          created_at: 0,
          delete_self_enabled: false,
          email_addresses: [
            {
              email_address: 'example@example.org',
              id: 'idn_test',
              linked_to: [],
              object: 'email_address' as const,
              verification: {
                attempts: 0,
                expire_at: 0,
                id: 'ver_test',
                object: 'email_address' as const,
                status: 'verified' as const,
                strategy: 'ticket' as const,
              },
            },
          ],
          external_accounts: [],
          external_id: null,
          first_name: 'Example',
          has_image: false,
          id: userId,
          image_url: 'https://img.clerk.com/xxxxxx',
          last_active_at: 0,
          last_name: 'Example',
          last_sign_in_at: null,
          legal_accepted_at: null,
          locale: 'en',
          locked: false,
          lockout_expires_in_seconds: null,
          object: 'user' as const,
          organization_memberships: [],
          password_enabled: false,
          password_last_updated_at: null,
          phone_numbers: [],
          primary_email_address_id: 'idn_test',
          primary_phone_number_id: null,
          primary_web3_wallet_id: null,
          private_metadata: {},
          public_metadata: {},
          saml_accounts: [],
          totp_enabled: false,
          two_factor_enabled: false,
          unsafe_metadata: {},
          updated_at: 0,
          username: null,
          verification_attempts_remaining: null,
          web3_wallets: [],
        },
        user_id: userId,
      },
      event_attributes: {
        http_request: {
          client_ip: '127.0.0.1',
          user_agent: 'test',
        },
      },
      object: 'event' as const,
      type: 'session.created' as const,
    } satisfies SessionWebhookEvent;

    const response = await handleSessionCreated(event);
    expect(response).toBeUndefined();

    const user = await db.query.Users.findFirst({
      where: eq(Users.clerkId, userId),
    });
    expect(user).toBeDefined();
    expect(user?.lastLoggedInAt).toBeInstanceOf(Date);
    await db.delete(Users).where(eq(Users.clerkId, userId));
  });
});
