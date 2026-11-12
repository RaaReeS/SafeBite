import type { Metadata } from "next";
import Link from "next/link";
import { PublishedBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { VerificationBadge } from "@/components/verification-status";
import { getMessages } from "@/i18n";
import {
  listRestaurantsForAdmin,
  type AdminRestaurant,
  type VerificationStatus,
} from "@/lib/data/admin-restaurants";
import { rejectRestaurant, resetRestaurantVerification, verifyRestaurant } from "./actions";
import { RejectForm } from "./reject-form";

export const metadata: Metadata = { title: "Verificación de restaurantes · SafeBite" };

type Filter = "pendientes" | "rechazados" | "verificados" | "todos";

const FILTERS: readonly Filter[] = ["pendientes", "rechazados", "verificados", "todos"];

const FILTER_STATUS: Record<Filter, VerificationStatus | null> = {
  pendientes: "pending",
  rechazados: "rejected",
  verificados: "verified",
  todos: null,
};

function parseFilter(value: string | string[] | undefined): Filter {
  return FILTERS.find((filter) => filter === value) ?? "pendientes";
}

const dateFormat = new Intl.DateTimeFormat("es-ES", {
  dateStyle: "medium",
  timeZone: "Europe/Madrid",
});

export default async function AdminRestaurantsPage({
  searchParams,
}: PageProps<"/admin/restaurantes">) {
  const t = getMessages();
  const filter = parseFilter((await searchParams).estado);
  const all = await listRestaurantsForAdmin();
  const status = FILTER_STATUS[filter];
  const rows = status === null ? all : all.filter((row) => row.verification_status === status);

  return (
    <>
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold">{t.admin.restaurants.title}</h1>
        <p className="text-zinc-700 dark:text-zinc-300">{t.admin.restaurants.description}</p>
      </div>

      <nav aria-label={t.admin.restaurants.filterLabel} className="flex flex-wrap gap-2">
        {FILTERS.map((option) => (
          <Link
            key={option}
            href={`/admin/restaurantes?estado=${option}`}
            aria-current={option === filter ? "page" : undefined}
            className={`rounded-full border px-3 py-1 text-sm ${
              option === filter
                ? "border-emerald-700 bg-emerald-700 text-white"
                : "border-zinc-300 hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-900"
            }`}
          >
            {t.admin.restaurants.filters[option]}
          </Link>
        ))}
      </nav>

      {rows.length === 0 ? (
        <p className="text-zinc-700 dark:text-zinc-300">{t.admin.restaurants.empty[filter]}</p>
      ) : (
        <ul className="flex flex-col gap-4">
          {rows.map((restaurant) => (
            <RestaurantCard key={restaurant.id} restaurant={restaurant} />
          ))}
        </ul>
      )}
    </>
  );
}

function RestaurantCard({ restaurant }: { restaurant: AdminRestaurant }) {
  const t = getMessages();
  const labels = t.admin.restaurants;
  const details: [string, string | null][] = [
    [labels.city, restaurant.city],
    [labels.address, restaurant.address],
    [labels.phone, restaurant.phone],
    [labels.contactEmail, restaurant.contact_email],
    [labels.ownerEmail, restaurant.owner_email],
    [labels.createdAt, dateFormat.format(new Date(restaurant.created_at))],
  ];

  return (
    <li
      aria-label={restaurant.name}
      className="flex flex-col gap-3 rounded-lg border border-zinc-200 p-4 dark:border-zinc-800"
    >
      <div className="flex flex-wrap items-center gap-2">
        <h2 className="text-lg font-semibold">{restaurant.name}</h2>
        <VerificationBadge status={restaurant.verification_status} />
        <PublishedBadge published={restaurant.published} />
      </div>

      <dl className="grid grid-cols-1 gap-x-4 gap-y-1 text-sm sm:grid-cols-[auto_1fr]">
        {details.map(([label, value]) => (
          <div key={label} className="contents">
            <dt className="text-zinc-600 dark:text-zinc-400">{label}</dt>
            <dd>{value ?? "—"}</dd>
          </div>
        ))}
      </dl>

      {restaurant.verification_status === "rejected" && restaurant.verification_note ? (
        <p className="text-sm">
          <span className="font-medium">{labels.rejectedReason}</span>{" "}
          {restaurant.verification_note}
        </p>
      ) : null}

      <div className="flex flex-col gap-3">
        {restaurant.verification_status === "verified" ? (
          <form action={resetRestaurantVerification.bind(null, restaurant.id)}>
            <Button type="submit" variant="secondary">
              {labels.backToPending}
            </Button>
          </form>
        ) : (
          <>
            <form action={verifyRestaurant.bind(null, restaurant.id)}>
              <Button type="submit">{labels.verify}</Button>
            </form>
            {restaurant.verification_status === "pending" ? (
              <RejectForm
                action={rejectRestaurant.bind(null, restaurant.id)}
                restaurantName={restaurant.name}
              />
            ) : null}
          </>
        )}
      </div>
    </li>
  );
}
