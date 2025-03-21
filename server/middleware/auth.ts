// Authentication middleware to guard routes
export default defineEventHandler((event) => {
  // Simplified auth for demo purposes
  // Let these paths through without authentication
  const publicPaths = ['/api/auth/login', '/api/users', '/login', '/signup', '/'];
  
  // Allow all API routes for demo purposes
  if (event.path?.startsWith('/api/')) {
    return;
  }
  
  // Check if it's a public path
  if (publicPaths.includes(event.path || '')) {
    return;
  }
  
  // Would check auth here in a real app
}); 