import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { getMessages } from "@/i18n";
import {
  listRequestSummary,
  type RequestSummary,
  type RestaurantRequestStatus,
} from "@/lib/data/restaurant-requests";
import { setRequestStatus } from "./actions";

export const metadata: Metadata = { title: "Solicitudes de restaurantes · SafeBite" };

type Filter = "pendientes" | "anadidos" | "todas";

const FILTERS: readonly Filter[] = ["pendientes", "anadidos", "todas"];

const FILTER_STATUS: Record<Filter, RestaurantRequestStatus | null> = {
  pendientes: "pending",
  anadidos: "added",
  todas: null,
};

function parseFilter(value: string | string[] | undefined): Filter {
  return FILTERS.find((filter) => filter === value) ?? "pendientes";
}

const dateFormat = new Intl.DateTimeFormat("es-ES", {
  dateStyle: "medium",
  timeZone: "Europe/Madrid",
});

export default async function RequestsPage({ searchParams }: PageProps<"/admin/solicitudes">) {
  const t = getMessages();
  const filter = parseFilter((await searchParams).estado);
  const all = await listRequestSummary();
  const status = FILTER_STATUS[filter];
  const rows = status === null ? all : all.filter((row) => row.status === status);

  return (
    <>
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">{t.admin.requests.title}</h1>
        <p className="text-muted">{t.admin.requests.description}</p>
      </div>

      <nav aria-label={t.admin.requests.filterLabel} className="flex flex-wrap gap-2">
        {FILTERS.map((option) => (
          <Link
            key={option}
            href={`/admin/solicitudes?estado=${option}`}
            aria-current={option === filter ? "page" : undefined}
            className={`inline-flex min-h-11 items-center rounded-full border px-4 text-sm font-semibold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-text ${
              option === filter
                ? "border-primary bg-primary text-on-primary"
                : "border-input bg-card hover:bg-surface"
            }`}
          >
            {t.admin.requests.filters[option]}
          </Link>
        ))}
      </nav>

      {rows.length === 0 ? (
        <p className="text-muted">{t.admin.requests.empty[filter]}</p>
      ) : (
        <div className="overflow-x-auto rounded-2xl bg-card shadow-card">
          <table className="w-full text-left text-sm">
            <caption className="sr-only">{t.admin.requests.title}</caption>
            <thead className="bg-surface text-muted">
              <tr>
                <th scope="col" className="px-4 py-2 font-medium">
                  {t.admin.requests.columns.restaurant}
                </th>
                <th scope="col" className="px-4 py-2 font-medium">
                  {t.admin.requests.columns.city}
                </th>
                <th scope="col" className="px-4 py-2 text-right font-medium">
                  {t.admin.requests.columns.count}
                </th>
                <th scope="col" className="px-4 py-2 font-medium">
                  {t.admin.requests.columns.last}
                </th>
                <th scope="col" className="px-4 py-2 font-medium">
                  {t.admin.requests.columns.status}
                </th>
                <th scope="col" className="px-4 py-2 font-medium">
                  <span className="sr-only">{t.admin.requests.columns.action}</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {rows.map((row) => (
                <RequestRow key={`${row.name_key}|${row.city_key}`} row={row} />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}

function RequestRow({ row }: { row: RequestSummary }) {
  const t = getMessages();
  const nextStatus: RestaurantRequestStatus = row.status === "pending" ? "added" : "pending";
  const actionLabel =
    nextStatus === "added" ? t.admin.requests.markAdded : t.admin.requests.markPending;

  return (
    <tr>
      <th scope="row" className="px-4 py-3 font-medium">
        {row.restaurant_name}
      </th>
      <td className="px-4 py-3">{row.city}</td>
      <td className="px-4 py-3 text-right tabular-nums">
        {row.request_count}
        {row.status === "pending" && row.pending_count < row.request_count ? (
          <span className="block text-xs text-muted">
            {t.admin.requests.newSinceAdded(row.pending_count)}
          </span>
        ) : null}
      </td>
      <td className="px-4 py-3 whitespace-nowrap">
        {dateFormat.format(new Date(row.last_requested_at))}
      </td>
      <td className="px-4 py-3">
        <span
          className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
            row.status === "added"
              ? "bg-primary-soft text-primary-strong"
              : "bg-warning-bg text-warning-fg"
          }`}
        >
          {t.admin.requests.statuses[row.status]}
        </span>
      </td>
      <td className="px-4 py-3">
        <form action={setRequestStatus}>
          <input type="hidden" name="name_key" value={row.name_key} />
          <input type="hidden" name="city_key" value={row.city_key} />
          <input type="hidden" name="status" value={nextStatus} />
          <Button
            type="submit"
            variant="secondary"
            aria-label={`${actionLabel}: ${row.restaurant_name} (${row.city})`}
          >
            {actionLabel}
          </Button>
        </form>
      </td>
    </tr>
  );
}
