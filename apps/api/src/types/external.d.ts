declare module '@vendia/serverless-express' {
  const serverlessExpress: any;
  export default serverlessExpress;
}

declare module 'aws-lambda' {
  export type Handler = any;
  export type Context = any;
  export type Callback = any;
}
