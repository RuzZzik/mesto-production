const getTemplate = () => {
  return document
    .getElementById("card-template")
    .content.querySelector(".card")
    .cloneNode(true);
};

export const createCardElement = (
  data,
  { onPreviewPicture, onLikeIcon, onDeleteCard, onInfoClick, currentUserId }
) => {
  const cardElement = getTemplate();
  const likeButton = cardElement.querySelector(".card__like-button");
  const deleteButton = cardElement.querySelector(".card__control-button_type_delete");
  const infoButton = cardElement.querySelector(".card__control-button_type_info");
  const cardImage = cardElement.querySelector(".card__image");
  const likeCountElement = cardElement.querySelector(".card__like-count");

  const likes = data.likes ?? [];
  const ownerId = data.owner?._id;
  const isMyCard = ownerId === currentUserId;
  const isLiked = likes.some((user) => user._id === currentUserId);

  cardImage.src = data.link;
  cardImage.alt = data.name;
  cardElement.querySelector(".card__title").textContent = data.name;
  likeCountElement.textContent = likes.length;
  likeButton.classList.toggle("card__like-button_is-active", isLiked);

  if (onLikeIcon) {
    likeButton.addEventListener("click", () =>
      onLikeIcon({
        cardId: data._id,
        isLiked: likeButton.classList.contains("card__like-button_is-active"),
        likeButton,
        likeCountElement,
      })
    );
  }

  if (!isMyCard) {
    deleteButton.remove();
  } else if (onDeleteCard) {
    deleteButton.addEventListener("click", () =>
      onDeleteCard({ cardId: data._id, cardElement })
    );
  }

  if (onInfoClick && infoButton) {
    infoButton.addEventListener("click", () => onInfoClick(data._id));
  }

  if (onPreviewPicture) {
    cardImage.addEventListener("click", () =>
      onPreviewPicture({ name: data.name, link: data.link })
    );
  }

  return cardElement;
};
