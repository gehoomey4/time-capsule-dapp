/** @type {import('next').NextConfig} */
const nextConfig = {
    turbopack: {}, // Empty config to silence warning but we'll use webpack
    webpack: (config) => {
        config.externals.push('pino-pretty', 'lokijs', 'encoding');
        return config;
    },
};

export default nextConfig;
