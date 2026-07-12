import { useMutation } from '@tanstack/react-query';
import { Check, Copy, KeyRound } from 'lucide-react';
import { useState } from 'react';
import toast from 'react-hot-toast';
import { Button, Input, Loader, Modal } from '@/components/common';
import { resetUserPassword } from '@/features/users/user.api';

export function ResetPasswordModal({ isOpen, onClose, user }) {
  const [copied, setCopied] = useState(false);
  const mutation = useMutation({ mutationFn: () => resetUserPassword(user._id) });
  const temporaryPassword = mutation.data?.data?.temporaryPassword;
  const close = () => {
    mutation.reset();
    setCopied(false);
    onClose();
  };
  const copyPassword = async () => {
    try {
      await navigator.clipboard.writeText(temporaryPassword);
      setCopied(true);
      toast.success('Temporary password copied');
    } catch {
      toast.error('Copy failed. Select and copy the password manually.');
    }
  };

  if (temporaryPassword)
    return (
      <Modal
        description="Copy this password now. It cannot be viewed again after this dialog is closed."
        footer={<Button onClick={close}>I have saved the password</Button>}
        isOpen={isOpen}
        onClose={close}
        title="Temporary Password"
      >
        <div className="space-y-4">
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
            <strong>Shown only once.</strong> Share it securely and ask the user to change it
            immediately.
          </div>
          <Input label="Temporary Password" readOnly value={temporaryPassword} />
          <Button className="w-full" onClick={copyPassword} variant="outline">
            {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
            {copied ? 'Copied' : 'Copy to clipboard'}
          </Button>
        </div>
      </Modal>
    );

  return (
    <Modal
      description={`A new temporary password will replace the current password for ${user.fullName || user.name}.`}
      footer={
        <>
          <Button disabled={mutation.isPending} onClick={close} variant="outline">
            Cancel
          </Button>
          <Button disabled={mutation.isPending} onClick={() => mutation.mutate()}>
            {mutation.isPending ? (
              <Loader className="text-white" label="Resetting..." size="sm" />
            ) : (
              <>
                <KeyRound className="size-4" /> Reset Password
              </>
            )}
          </Button>
        </>
      }
      isOpen={isOpen}
      onClose={close}
      title="Reset user password?"
    >
      <p className="text-sm text-slate-600">
        The user’s existing password will stop working immediately.
      </p>
    </Modal>
  );
}
