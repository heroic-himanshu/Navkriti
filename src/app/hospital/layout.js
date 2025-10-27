// app/admin/layout.js
import AdminPusherListener from '@/components/AdminPusherListener';

export default function AdminLayout({ children }) {
  return (
    <div>
      <AdminPusherListener />
      {children}
    </div>
  );
}
