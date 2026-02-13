export default (): Record<string, unknown> => ({
  http: { port: parseInt(process.env.PORT || '3000', 10) },
  grpc: {
    host: process.env.GRPC_HOST || 'localhost',
    port: parseInt(process.env.GRPC_PORT || '5000', 10),
  },
});
