import { Avatar } from "@/components/common/avatar";
import type { AdminUser } from "@/types";

export function DoctorsTable({ doctors }: { doctors: AdminUser[] }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-border">
      <table className="w-full text-sm">
        <thead className="border-b border-border bg-muted/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
          <tr>
            <th className="px-4 py-3 font-medium">Doctor</th>
            <th className="px-4 py-3 font-medium">Email</th>
            <th className="px-4 py-3 font-medium">Phone</th>
            <th className="px-4 py-3 font-medium">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {doctors.map((doctor) => (
            <tr key={doctor.id} className="bg-card">
              <td className="px-4 py-3">
                <div className="flex items-center gap-2.5">
                  <Avatar src={doctor.avatarUrl} name={doctor.name} size="sm" />
                  <span className="font-medium text-foreground">{doctor.name}</span>
                </div>
              </td>
              <td className="px-4 py-3 text-muted-foreground">{doctor.email}</td>
              <td className="px-4 py-3 text-muted-foreground">{doctor.phone ?? "—"}</td>
              <td className="px-4 py-3">
                <span
                  className={
                    doctor.isActive
                      ? "rounded-full bg-status-approved/15 px-2 py-0.5 text-xs font-medium text-status-approved"
                      : "rounded-full bg-status-cancelled px-2 py-0.5 text-xs font-medium text-status-cancelled-foreground"
                  }
                >
                  {doctor.isActive ? "Active" : "Deactivated"}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
