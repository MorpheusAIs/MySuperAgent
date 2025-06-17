/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  env: {
    NEXT_PUBLIC_API_BASE_URL:
      process.env.APP_ENV === "production"
        ? "https://api.mysuperagent.io"
        : process.env.APP_ENV === "staging"
        ? "https://api-staging.mysuperagent.io"
        : "http://localhost:8888",
  },
  images: {
    unoptimized: true,
  },
  trailingSlash: false,
  poweredByHeader: false,
  typescript: {
    ignoreBuildErrors: false,
  },
  eslint: {
    ignoreDuringBuilds: false,
  },
  webpack: (config, { isServer, webpack }) => {
    // Configure Terser to handle ES modules properly
    if (config.optimization && config.optimization.minimizer) {
      config.optimization.minimizer = config.optimization.minimizer.map((plugin) => {
        if (plugin.constructor.name === 'TerserPlugin') {
          plugin.options.terserOptions = {
            ...plugin.options.terserOptions,
            module: true,
            parse: {
              ecma: 2020,
            },
            format: {
              ecma: 2020,
            },
          };
        }
        return plugin;
      });
    }

    // Ignore problematic worker files
    config.plugins.push(
      new webpack.IgnorePlugin({
        resourceRegExp: /HeartbeatWorker\.js$/,
      })
    );

    // Fallback for modules that might not be available in the browser
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        crypto: false,
        stream: false,
        buffer: false,
      };
    }

    return config;
  },
};

module.exports = nextConfig;
