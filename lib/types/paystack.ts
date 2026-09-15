export type PaystackInitializeResponse = {
  status: boolean;
  message: string;
  data?: {
    reference: string;
    authorization_url: string;
    access_code: string;
  };
};

export type PaystackVerifyResponse = {
  status: boolean;
  message: string;
  data?: {
    id: number;
    domain: string;
    status: string;
    reference: string;
    amount: number;
    currency: string;
    gateway_response: string | null;
    paid_at: string | null;
    created_at: string;
    channel: string;
    metadata: Record<string, unknown> | null;
  };
};
