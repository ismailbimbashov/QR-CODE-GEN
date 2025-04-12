function updateInputFields() {
  const qrType = document.getElementById("qr-type").value;
  const inputFieldsContainer = document.getElementById("input-fields");

  let inputFields = "";

  if (qrType === "text") {
    inputFields =
      '<input type="text" id="text-input" placeholder="Enter text">';
  } else if (qrType === "url") {
    inputFields = '<input type="text" id="url-input" placeholder="Enter URL">';
  } else if (qrType === "wifi") {
    inputFields = `
            <input type="text" id="wifi-ssid" placeholder="Enter Wi-Fi SSID">
            <input type="password" id="wifi-password" placeholder="Enter Wi-Fi Password">
            <select id="wifi-encryption">
                <option value="WPA">WPA/WPA2</option>
                <option value="WEP">WEP</option>
                <option value="nopass">No Encryption</option>
            </select>`;
  }

  inputFieldsContainer.innerHTML = inputFields;
}
function generateQRCode() {
  const qrType = document.getElementById("qr-type").value;
  const qrCodeContainer = document.getElementById("qrcode");
  qrCodeContainer.innerHTML = "";
  const iconSelect = document.getElementById("icon-select").value;

  let text = "";

  if (qrType === "text") {
    text = document.getElementById("text-input").value;
    if (!text) {
      alert("Please enter some text");
      return;
    }
  } else if (qrType === "url") {
    text = document.getElementById("url-input").value;
    if (!text) {
      alert("Please enter a URL");
      return;
    }
  } else if (qrType === "wifi") {
    const ssid = document.getElementById("wifi-ssid").value;
    const password = document.getElementById("wifi-password").value;
    const encryption = document.getElementById("wifi-encryption").value;

    if (!ssid) {
      alert("Please enter the Wi-Fi SSID");
      return;
    }

    text = `WIFI:S:${ssid};T:${encryption};P:${password};;`;
  }

  const qrCode = new QRCodeStyling({
    width: 256,
    height: 256,
    data: text,
    dotsOptions: {
      color: "#000",
      type: "rounded",
    },
    imageOptions: {
      crossOrigin: "anonymous",
      margin: 20,
    },
  });

  if (iconSelect) {
    const iconElement = document.createElement("i");
    iconElement.className = `fab ${iconSelect}`;
    iconElement.style.fontSize = "64px";
    iconElement.style.position = "absolute";
    iconElement.style.transform = "translate(-50%, -50%)";
    iconElement.style.left = "50%";
    iconElement.style.top = "50%";
    qrCodeContainer.style.position = "relative";

    qrCode.append(qrCodeContainer);
    qrCodeContainer.appendChild(iconElement);
  } else {
    qrCode.append(qrCodeContainer);
  }
}
updateInputFields();
