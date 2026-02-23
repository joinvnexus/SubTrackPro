import { z } from 'zod';
import { insertSubscriptionSchema, loginSchema } from './schema';

export const errorSchemas = {
  validation: z.object({
    message: z.string(),
    field: z.string().optional(),
  }),
  notFound: z.object({
    message: z.string(),
  }),
  internal: z.object({
    message: z.string(),
  }),
  unauthorized: z.object({
    message: z.string(),
  })
};

const userResponseSchema = z.object({
  id: z.string(),
  email: z.string(),
  plan: z.string(),
  createdAt: z.any(),
});

const subscriptionResponseSchema = z.object({
  id: z.string(),
  userId: z.string(),
  name: z.string(),
  price: z.number(),
  billingCycle: z.string(),
  category: z.string(),
  renewalDate: z.any(),
  createdAt: z.any(),
});

export const api = {
  auth: {
    register: {
      method: 'POST' as const,
      path: '/api/auth/register' as const,
      input: loginSchema,
      responses: {
        201: userResponseSchema,
        400: errorSchemas.validation,
      },
    },
    login: {
      method: 'POST' as const,
      path: '/api/auth/login' as const,
      input: loginSchema,
      responses: {
        200: userResponseSchema,
        401: errorSchemas.unauthorized,
      },
    },
    logout: {
      method: 'POST' as const,
      path: '/api/auth/logout' as const,
      responses: {
        200: z.object({ message: z.string() }),
      },
    },
    me: {
      method: 'GET' as const,
      path: '/api/auth/me' as const,
      responses: {
        200: userResponseSchema,
        401: errorSchemas.unauthorized,
      },
    }
  },
  subscriptions: {
    list: {
      method: 'GET' as const,
      path: '/api/subscriptions' as const,
      responses: {
        200: z.array(subscriptionResponseSchema),
        401: errorSchemas.unauthorized,
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/subscriptions' as const,
      input: insertSubscriptionSchema,
      responses: {
        201: subscriptionResponseSchema,
        400: errorSchemas.validation,
        401: errorSchemas.unauthorized,
        403: errorSchemas.unauthorized,
      },
    },
    update: {
      method: 'PUT' as const,
      path: '/api/subscriptions/:id' as const,
      input: insertSubscriptionSchema.partial(),
      responses: {
        200: subscriptionResponseSchema,
        400: errorSchemas.validation,
        401: errorSchemas.unauthorized,
        404: errorSchemas.notFound,
      },
    },
    delete: {
      method: 'DELETE' as const,
      path: '/api/subscriptions/:id' as const,
      responses: {
        204: z.void(),
        401: errorSchemas.unauthorized,
        404: errorSchemas.notFound,
      },
    }
  },
  billing: {
    upgrade: {
      method: 'POST' as const,
      path: '/api/billing/upgrade' as const,
      responses: {
        200: userResponseSchema,
        401: errorSchemas.unauthorized,
      }
    }
  }
};

export function buildUrl(path: string, params?: Record<string, string | number>): string {
  let url = path;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (url.includes(`:${key}`)) {
        url = url.replace(`:${key}`, String(value));
      }
    });
  }
  return url;
}

export type SubscriptionInput = z.infer<typeof api.subscriptions.create.input>;
export type SubscriptionResponse = z.infer<typeof subscriptionResponseSchema>;
export type UserResponse = z.infer<typeof userResponseSchema>;
