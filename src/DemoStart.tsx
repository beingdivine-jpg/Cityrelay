import { useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useApp } from "./components";
import { useShared } from "./SharedContext";
import { DEMO_ID, startDemo } from "./demo";
import { t } from "./i18n";
export default function DemoStart() {
  const { update } = useApp();
  const shared = useShared();
  const navigate = useNavigate();
  const started = useRef(false);
  useEffect(() => {
    if (shared.workspace || started.current) return;
    started.current = true;
    update(startDemo);
    navigate(`/community/${DEMO_ID}`, { replace: true });
  }, [shared.workspace, update, navigate]);
  return (
    <div className="page-width safety-page">
      {shared.workspace ? (
        <>
          <h1>{t("Your team workspace is open")}</h1>
          <p>
            {t(
              "Save your team edits, then return to local exploration to open the separate Kraków demo.",
            )}
          </p>
          <Link className="button" to="/account">
            {t("Account & backup")}
          </Link>
        </>
      ) : (
        <p role="status">{t("Opening the Kraków demo…")}</p>
      )}
    </div>
  );
}
