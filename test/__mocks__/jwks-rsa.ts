/* eslint-disable */
type JwksRsaOptions = {
    jwksUri?: string;
    cache?: boolean;
    rateLimit?: boolean;
    jwksRequestsPerMinute?: number;
    requestHeaders?: Record<string, string>;
    timeout?: number;
};

type SigningKey = {
    getPublicKey: () => string;
    rsaPublicKey?: string;
    publicKey?: string;
    kid?: string;
};

type JwksClientLike = {
    getSigningKey: (kid: string) => Promise<SigningKey>;
};

const jwksRsa = jest.fn((options: JwksRsaOptions = {}) => {
    const client: JwksClientLike = {
        getSigningKey: jest.fn(async (kid: string) => ({
            kid,
            getPublicKey: () => '-----BEGIN PUBLIC KEY-----\nMOCK\n-----END PUBLIC KEY-----',
            publicKey: '-----BEGIN PUBLIC KEY-----\nMOCK\n-----END PUBLIC KEY-----',
            rsaPublicKey: '-----BEGIN PUBLIC KEY-----\nMOCK\n-----END PUBLIC KEY-----'
        }))
    };

    return client;
});

(jwksRsa as any).default = jwksRsa;

export = jwksRsa;
