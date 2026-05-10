export function openLoginModal() {
  const dialog = document.getElementById("authDialog");

  if (dialog?.showModal) {
    dialog.showModal();
  }
}