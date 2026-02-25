declare module 'connect-pg-simple' {
  import session from 'express-session';
  
  interface ConnectPgSimpleOptions {
    pool?: any;
    tableName?: string;
    schemaName?: string;
    createTableIfMissing?: boolean;
  }
  
  function connectPgSimple(session: typeof session): new (options?: ConnectPgSimpleOptions) => session.Store;
  
  export default connectPgSimple;
}
