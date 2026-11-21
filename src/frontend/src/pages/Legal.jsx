import { NavLink } from "react-router-dom";

function LegalShell({ title, children }) {
  return (
    <div className="page">
      <div className="container" style={{ maxWidth: 820 }}>
        <div className="page-head reveal">
          <p className="eyebrow">Legal</p>
          <h1 className="page-title">{title}</h1>
        </div>
        <div className="panel reveal d1">
          <div className="legal-body">{children}</div>
          <p className="muted" style={{ marginTop: 24, fontSize: 14 }}>
            Questions?{" "}
            <a href="mailto:devopsmate7@gmail.com">devopsmate7@gmail.com</a> or WhatsApp{" "}
            <a href="https://wa.me/918088929670" target="_blank" rel="noreferrer">
              +91 80889 29670
            </a>
            .
          </p>
        </div>
        <div className="legal-links">
          <NavLink to="/terms" className="btn btn-secondary btn-sm">
            Terms of use
          </NavLink>
          <NavLink to="/privacy" className="btn btn-secondary btn-sm">
            Privacy policy
          </NavLink>
          <NavLink to="/refund" className="btn btn-secondary btn-sm">
            Refund policy
          </NavLink>
        </div>
      </div>
    </div>
  );
}

export function Terms() {
  return (
    <LegalShell title="Terms of use">
      <p>
        By creating an account, enrolling, or using DevOpsMate, you agree to these terms. Our services
        include AWS + DevOps + AI training, Job Support, Interview Support, and the Offline Interview
        Q&A pack.
      </p>
      <p>
        You confirm that the details you share are accurate and that you will use the platform only for
        lawful learning. Account sharing, reselling access, or redistributing course or pack material is
        not allowed.
      </p>
      <p>
        Enrollment grants access to the selected service as described on the service page and in the
        confirmation we send after WhatsApp enrollment or approved UPI payment. Session timings may change
        with notice. Fake payments, chargebacks without cause, or abusive behavior may result in account
        suspension.
      </p>
      <p>
        Offline Interview Q&A pack delivery happens only after admin approval of your payment proof. Once
        approved, the ZIP is emailed to the address on your account.
      </p>
    </LegalShell>
  );
}

export function Privacy() {
  return (
    <LegalShell title="Privacy policy">
      <p>
        We store your full name, email, mobile, city, password hash, and order history so we can run
        registration, enrollments, pack delivery, and support communication.
      </p>
      <p>
        We do not sell personal data. Access is limited to operating DevOpsMate services. You can update
        your profile from your account page. For deletion requests, email{" "}
        <a href="mailto:devopsmate7@gmail.com">devopsmate7@gmail.com</a>.
      </p>
    </LegalShell>
  );
}

export function Refund() {
  return (
    <LegalShell title="Refund policy">
      <p>
        All DevOpsMate training, support, and pack purchases are final. After order confirmation or pack
        approval, fees are non-refundable, including change of mind, schedule conflict, or partial
        attendance.
      </p>
      <p>
        A batch or schedule transfer may be considered before the first live session of the enrolled
        package, only if seats are available, and only at DevOpsMate discretion. No cash or wallet refunds
        are issued.
      </p>
    </LegalShell>
  );
}
