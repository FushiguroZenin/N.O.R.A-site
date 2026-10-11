"use client";

export function BackButton() {
  function goBack() {
    if (window.history.length > 1) {
      window.history.back();
      return;
    }

    window.location.assign("/#catalogue");
  }

  return <button type="button" className="back-button" onClick={goBack}>Back</button>;
}
