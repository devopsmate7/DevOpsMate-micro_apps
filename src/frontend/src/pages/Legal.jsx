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
            Questions? <a href="mailto:devopsmate7@gmail.com">devopsmate7@gmail.com</a>
          </p>
        </div>
        <div className="legal-links">
          <NavLink to="/terms" className="btn btn-secondary btn-sm">
            Terms
          </NavLink>
          <NavLink to="/privacy" className="btn btn-secondary btn-sm">
            Privacy
          </NavLink>
          <NavLink to="/refund" className="btn btn-secondary btn-sm">
            Refund
          </NavLink>
        </div>
      </div>
    </div>
  );
}

export function Terms() {
  return (
    <LegalShell title="Terms and Conditions">
      <p>
        DevOpsMate provides online services: AWS + DevOps + AI, Job Support, and Interview Support.
        By creating an account or purchasing, you confirm your details are accurate and you will use the
        platform for lawful learning only.
      </p>
      <p>
        Enrollment grants access to the selected package according to the schedule shared after purchase.
        Session timings may change with notice. Sharing account access or redistributing course material is
        not allowed.
      </p>
      <p>
        Checkout confirmation creates a paid enrollment order visible in your profile and My orders. Fake
        payments, chargebacks without cause, or abusive behavior may result in account suspension.
      </p>
    </LegalShell>
  );
}

export function Privacy() {
  return (
    <LegalShell title="Privacy Policy">
      <p>
        We store your full name, email, mobile, city, password hash, and order history to run registration,
        enrollments, and support communication.
      </p>
      <p>
        We do not sell personal data. Access is limited to operating DevOpsMate services. Profile updates can
        be made from your account page. For deletion requests email devopsmate7@gmail.com.
      </p>
    </LegalShell>
  );
}

export function Refund() {
  return (
    <LegalShell title="Refund Policy">
      <p>
        All DevOpsMate training and support package purchases are final. After order confirmation, fees are
        non-refundable under any circumstances, including change of mind, schedule conflict, or partial
        attendance.
      </p>
      <p>
        Batch transfer may be considered before the first live session of the enrolled package, only if seats
        are available, and only at DevOpsMate discretion. No cash or wallet refunds are issued.
      </p>
      <p>By continuing at checkout, you acknowledge the no-refund terms.</p>
    </LegalShell>
  );
}
