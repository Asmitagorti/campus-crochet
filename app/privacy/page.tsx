import Link from "next/link";
export const metadata = { title: "Privacy & your details | Campus-Crochet" };
export default function Privacy() {
  return (
    <main className="page-wrap policy-page">
      <span className="eyebrow">Care extends to your details, too</span>
      <h1>A little privacy promise ♡</h1>
      <section>
        <h2>What we ask for</h2>
        <p>
          For an order, we ask for your name, email, phone number, campus pickup
          details and any note you choose to share. A contact message includes
          your name, email, topic and message.
        </p>
      </section>
      <section>
        <h2>What we use it for</h2>
        <p>
          We use these details to answer your questions, arrange your order and
          pickup, and resolve order issues. Order and message records are stored
          in the studio's website database. We do not add you to a marketing
          list.
        </p>
      </section>
      <section>
        <h2>Payments</h2>
        <p>
          Payments are handled by Razorpay. Card numbers, UPI credentials and
          other payment credentials are entered in Razorpay's checkout and are
          not stored in our database. We keep order references, payment
          references, amounts and payment status.
        </p>
      </section>
      <section>
        <h2>On your device</h2>
        <p>
          Your bag, favourite products and chosen theme are saved in your
          browser. Clearing your browser's website storage removes them. A
          pending payment reference may be stored in your browser session so you
          can verify a payment if interrupted.
        </p>
      </section>
      <section>
        <h2>Questions or deletion requests</h2>
        <p>
          Contact the studio on <a href="tel:+917674971144">+91 76749 71144</a>{" "}
          or through our <Link href="/contact">contact page</Link> to ask about
          your details. Records needed to fulfil an order or meet applicable
          record-keeping requirements may need to be retained.
        </p>
      </section>
    </main>
  );
}
