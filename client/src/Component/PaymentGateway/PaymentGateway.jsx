import React from "react";

function Payment() {
  const loadRazorpay = () => {
    fetch("http://localhost:5000/create-order", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount: 500 }), // ₹5.00
    })
      .then((res) => res.json())
      .then((order) => {
        const options = {
          key: "YOUR_KEY_ID", // from Razorpay dashboard
          amount: order.amount,
          currency: order.currency,
          name: "My App",
          description: "Test Transaction",
          order_id: order.id,
          handler: function (response) {
            alert("Payment Successful! Payment ID: " + response.razorpay_payment_id);
          },
          theme: {
            color: "#3399cc",
          },
        };

        const rzp = new window.Razorpay(options);
        rzp.open();
      });
  };

  return <button onClick={loadRazorpay}>Pay ₹5</button>;
}

export default Payment;
