// ============================================================
// src/app/(app)/users/page.tsx
// Admin User Management dashboard.
// ============================================================

"use client";

import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion } from "framer-motion";
import {
  Plus,
  Loader2,
  UserCog,
  Lock,
  Unlock,
  Trash2,
  UserX,
  UserCheck,
  Key,
  Shield,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { RoleGuard } from "@/components/guards/RoleGuard";
import {
  useUsers,
  useCreateUser,
  useDeleteUser,
  useDeactivateUser,
  useActivateUser,
  useUnlockUser,
  useResetUserPassword,
} from "@/features/users/hooks/useUsers";
import type { User, Role } from "@/types/models";

// ---- Create user form schema ----
const createSchema = z.object({
  full_name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  role: z.enum(["employee", "manager", "hr", "admin"]),
  department: z.string().optional(),
});
type CreateFormValues = z.infer<typeof createSchema>;

const ROLE_COLORS: Record<string, string> = {
  admin: "bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-300",
  hr: "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300",
  manager: "bg-amber-100 text-amber-800 dark:bg-amber-900/20 dark:text-amber-300",
  employee: "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300",
};

function UserRow({ user }: { user: User }) {
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [resetOpen, setResetOpen] = useState(false);
  const [newPass, setNewPass] = useState("");

  const deactivate = useDeactivateUser();
  const activate = useActivateUser();
  const unlock = useUnlockUser();
  const deleteUser = useDeleteUser();
  const resetPw = useResetUserPassword();

  return (
    <>
      <tr className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
        <td className="px-4 py-3">
          <div>
            <p className="text-sm font-medium">{user.full_name ?? "—"}</p>
            <p className="text-xs text-muted-foreground">{user.email}</p>
          </div>
        </td>
        <td className="px-4 py-3">
          <span className={`text-xs font-medium px-2 py-0.5 rounded-full capitalize ${ROLE_COLORS[user.role] ?? ""}`}>
            {user.role}
          </span>
        </td>
        <td className="px-4 py-3 text-sm text-muted-foreground">{user.department ?? "—"}</td>
        <td className="px-4 py-3">
          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${user.is_active ? "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300" : "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300"}`}>
            {user.is_active ? "Active" : "Inactive"}
          </span>
        </td>
        <td className="px-4 py-3">
          <div className="flex gap-1.5 flex-wrap">
            {/* Activate / Deactivate */}
            {user.is_active ? (
              <Button
                size="sm"
                variant="outline"
                className="h-7 px-2 text-xs gap-1"
                onClick={() => deactivate.mutate(user.id)}
                disabled={deactivate.isPending}
              >
                <UserX className="w-3 h-3" /> Deactivate
              </Button>
            ) : (
              <Button
                size="sm"
                variant="outline"
                className="h-7 px-2 text-xs gap-1"
                onClick={() => activate.mutate(user.id)}
                disabled={activate.isPending}
              >
                <UserCheck className="w-3 h-3" /> Activate
              </Button>
            )}
            {/* Unlock */}
            <Button
              size="sm"
              variant="outline"
              className="h-7 px-2 text-xs gap-1"
              onClick={() => unlock.mutate(user.id)}
              disabled={unlock.isPending}
            >
              <Unlock className="w-3 h-3" /> Unlock
            </Button>
            {/* Reset password */}
            <Button
              size="sm"
              variant="outline"
              className="h-7 px-2 text-xs gap-1"
              onClick={() => setResetOpen(true)}
            >
              <Key className="w-3 h-3" /> Reset PW
            </Button>
            {/* Delete */}
            <Button
              size="sm"
              variant="outline"
              className="h-7 px-2 text-xs gap-1 text-destructive border-destructive/30"
              onClick={() => setDeleteOpen(true)}
            >
              <Trash2 className="w-3 h-3" /> Delete
            </Button>
          </div>
        </td>
      </tr>

      {/* Delete confirm */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete user?</AlertDialogTitle>
            <AlertDialogDescription>
              <strong>{user.full_name ?? user.email}</strong> will be permanently deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground"
              onClick={() => { deleteUser.mutate(user.id); setDeleteOpen(false); }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Reset password dialog */}
      <Dialog open={resetOpen} onOpenChange={setResetOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Reset Password</DialogTitle>
            <DialogDescription>Set a temporary password for {user.full_name ?? user.email}. They will be forced to change it on next login.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label>New temporary password</Label>
              <Input
                type="text"
                value={newPass}
                onChange={(e) => setNewPass(e.target.value)}
                placeholder="Min. 8 characters"
                className="h-10"
              />
            </div>
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setResetOpen(false)}>Cancel</Button>
              <Button
                disabled={newPass.length < 8 || resetPw.isPending}
                onClick={() => {
                  resetPw.mutate({ id: user.id, body: { new_password: newPass } });
                  setResetOpen(false);
                  setNewPass("");
                }}
              >
                {resetPw.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Reset
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default function UsersPage() {
  const { data: users, isLoading } = useUsers();
  const createUser = useCreateUser();
  const [open, setOpen] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreateFormValues>({
    resolver: zodResolver(createSchema),
    defaultValues: { role: "employee" },
  });

  const onSubmit = async (values: CreateFormValues) => {
    await createUser.mutateAsync(values);
    reset();
    setOpen(false);
  };

  return (
    <RoleGuard
      allowedRoles={["admin"]}
      fallback={
        <div className="flex items-center justify-center h-64">
          <div className="text-center space-y-2">
            <Shield className="w-10 h-10 mx-auto text-muted-foreground opacity-30" />
            <p className="text-muted-foreground">Admin access required.</p>
          </div>
        </div>
      }
    >
      <div className="space-y-6 max-w-7xl mx-auto">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold tracking-tight">User Management</h1>
            <p className="text-sm text-muted-foreground">
              {users?.length ?? 0} total users
            </p>
          </div>
          <Button onClick={() => setOpen(true)} className="gap-2 h-9">
            <Plus className="w-4 h-4" />
            Create User
          </Button>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="border border-border rounded-xl overflow-hidden bg-card"
        >
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  {["User", "Role", "Department", "Status", "Actions"].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  Array.from({ length: 6 }).map((_, i) => (
                    <tr key={i} className="border-b border-border">
                      {Array.from({ length: 5 }).map((_, j) => (
                        <td key={j} className="px-4 py-3"><Skeleton className="h-4 w-full" /></td>
                      ))}
                    </tr>
                  ))
                ) : users && users.length > 0 ? (
                  users.map((user) => <UserRow key={user.id} user={user} />)
                ) : (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-sm text-muted-foreground">
                      <UserCog className="w-8 h-8 mx-auto mb-2 opacity-30" />
                      No users found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </motion.div>

        {/* Create User Dialog */}
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Create New User</DialogTitle>
              <DialogDescription>
                Add a new employee to the HR system.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4 pt-2">
              <div className="space-y-1.5">
                <Label htmlFor="create-name">Full name</Label>
                <Input id="create-name" placeholder="Alex Johnson" className="h-10" {...register("full_name")} />
                {errors.full_name && <p className="text-xs text-destructive">{errors.full_name.message}</p>}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="create-email">Email</Label>
                <Input id="create-email" type="email" placeholder="user@company.com" className="h-10" {...register("email")} />
                {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="create-password">Password</Label>
                <Input id="create-password" type="password" placeholder="Min. 8 characters" className="h-10" {...register("password")} />
                {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Role</Label>
                  <Controller
                    name="role"
                    control={control}
                    render={({ field }) => (
                      <Select onValueChange={(v) => field.onChange(v as Role)} defaultValue={field.value}>
                        <SelectTrigger className="h-10"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {(["employee", "manager", "hr", "admin"] as Role[]).map((r) => (
                            <SelectItem key={r} value={r} className="capitalize">{r}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="create-dept">Department</Label>
                  <Input id="create-dept" placeholder="e.g., Engineering" className="h-10" {...register("department")} />
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Create User
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </RoleGuard>
  );
}
