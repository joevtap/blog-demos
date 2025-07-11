const INTERVAL_MS = 500;

function getRandomOrder() {
  return {
    productId: Math.floor(Math.random() * 100) + 1,
    amount: Math.floor(Math.random() * 5) + 1,
  };
}

async function sendOrder() {
  const order = getRandomOrder();
  try {
    const res = await fetch("http://localhost:8080/orders", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(order),
    });
    console.log("Sent:", order, "Response:", res.status);
  } catch (err) {
    console.error("Error sending order:", err.message);
  }
}

setInterval(sendOrder, INTERVAL_MS);
