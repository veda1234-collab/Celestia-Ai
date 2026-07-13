'use client';

import { useState } from 'react';
import { UserRound } from 'lucide-react';
import { useAuth } from '@/lib/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { AuthDialog } from './auth-dialog';

export function AccountButton() {
  const { user, enabled, ready } = useAuth();
  const [open, setOpen] = useState(false);

  if (!ready || !enabled) return null;

  return (
    <>
      <Button variant={user ? 'glass' : 'outline'} size="sm" onClick={() => setOpen(true)}>
        <UserRound className="h-4 w-4" />
        <span className="hidden sm:inline">{user ? user.name.split(' ')[0] : 'Sign in'}</span>
      </Button>
      <AuthDialog open={open} onOpenChange={setOpen} />
    </>
  );
}
