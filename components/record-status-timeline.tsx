type ListingStatus = "draft" | "submitted" | "changes_requested" | "published";

const order: ListingStatus[] = ["draft", "submitted", "published"];
const labels: Record<ListingStatus, string> = { draft: "Draft", submitted: "Submitted", changes_requested: "Changes requested", published: "Live" };

export function RecordStatusTimeline({ status }: { status: ListingStatus }) {
  const activeIndex = status === "changes_requested" ? 1 : order.indexOf(status);
  return <ol className={`record-timeline ${status}`}>{order.map((step, index) => <li className={index < activeIndex ? "complete" : index === activeIndex ? "current" : ""} key={step}><span>{index + 1}</span><b>{index === 1 && status === "changes_requested" ? labels.changes_requested : labels[step]}</b></li>)}</ol>;
}
