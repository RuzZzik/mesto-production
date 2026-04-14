import { createCardElement } from "./components/card.js";
import { enableValidation, clearValidation } from "./components/validation.js";
import {
  openModalWindow,
  closeModalWindow,
  setCloseModalWindowEventListeners,
} from "./components/modal.js";
import {
  getCardList,
  getUserInfo,
  setUserInfo,
  setUserAvatar,
  addCard,
  deleteCard as deleteCardRequest,
  changeLikeCardStatus,
} from "./components/api.js";

// DOM узлы
const placesWrap = document.querySelector(".places__list");
const connectionErrorElement = document.querySelector(".page__connection-error");
const profileFormModalWindow = document.querySelector(".popup_type_edit");
const profileForm = profileFormModalWindow.querySelector(".popup__form");
const profileTitleInput = profileForm.querySelector(".popup__input_type_name");
const profileDescriptionInput = profileForm.querySelector(".popup__input_type_description");

const cardFormModalWindow = document.querySelector(".popup_type_new-card");
const cardForm = cardFormModalWindow.querySelector(".popup__form");
const cardNameInput = cardForm.querySelector(".popup__input_type_card-name");
const cardLinkInput = cardForm.querySelector(".popup__input_type_url");

const imageModalWindow = document.querySelector(".popup_type_image");
const imageElement = imageModalWindow.querySelector(".popup__image");
const imageCaption = imageModalWindow.querySelector(".popup__caption");

const openProfileFormButton = document.querySelector(".profile__edit-button");
const openCardFormButton = document.querySelector(".profile__add-button");

const profileTitle = document.querySelector(".profile__title");
const profileDescription = document.querySelector(".profile__description");
const profileAvatar = document.querySelector(".profile__image");

const avatarFormModalWindow = document.querySelector(".popup_type_edit-avatar");
const avatarForm = avatarFormModalWindow.querySelector(".popup__form");
const avatarInput = avatarForm.querySelector(".popup__input");
const removeCardModalWindow = document.querySelector(".popup_type_remove-card");
const removeCardForm = removeCardModalWindow?.querySelector(".popup__form");
const cardInfoModalWindow = document.querySelector(".popup_type_info");
const cardInfoTitle = cardInfoModalWindow?.querySelector(".popup__title");
const cardInfoList = cardInfoModalWindow?.querySelector(".popup__info");
const cardInfoText = cardInfoModalWindow?.querySelector(".popup__text");
const cardInfoUsersList = cardInfoModalWindow?.querySelector(".popup__list");

const validationSettings = {
  formSelector: ".popup__form",
  inputSelector: ".popup__input",
  submitButtonSelector: ".popup__button",
  inactiveButtonClass: "popup__button_disabled",
  inputErrorClass: "popup__input_type_error",
  errorClass: "popup__error_visible",
};

let currentUserId = "";
let cardToDeleteData = null;

const setButtonText = (formElement, isLoading, loadingText) => {
  const buttonElement = formElement.querySelector(".popup__button");
  const defaultText = buttonElement.dataset.defaultText || buttonElement.textContent;
  buttonElement.dataset.defaultText = defaultText;
  buttonElement.textContent = isLoading ? loadingText : defaultText;
};

const logApiError = (err) => {
  if (err.name === "AbortError") {
    console.log("Ошибка: превышено время ожидания ответа сервера");
    return;
  }
  console.log(err);
};

const showConnectionError = () => {
  if (connectionErrorElement) {
    connectionErrorElement.hidden = false;
  }
  if (profileTitle && !profileTitle.textContent) {
    profileTitle.textContent = "—";
  }
  if (profileDescription && !profileDescription.textContent) {
    profileDescription.textContent = "Данные не загружены";
  }
};

const createInfoString = (term, description) => {
  const template = document.getElementById("popup-info-definition-template");
  if (!template) {
    return null;
  }
  const infoElement = document
    .getElementById("popup-info-definition-template")
    .content.querySelector(".popup__info-item")
    .cloneNode(true);

  infoElement.querySelector(".popup__info-term").textContent = term;
  infoElement.querySelector(".popup__info-description").textContent = description;
  return infoElement;
};

const createLikedUserBadge = (userName) => {
  const template = document.getElementById("popup-info-user-preview-template");
  if (!template) {
    return null;
  }
  const userBadgeElement = document
    .getElementById("popup-info-user-preview-template")
    .content.querySelector(".popup__list-item")
    .cloneNode(true);

  userBadgeElement.textContent = userName;
  return userBadgeElement;
};

const formatDate = (date) =>
  date.toLocaleDateString("ru-RU", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

const handlePreviewPicture = ({ name, link }) => {
  imageElement.src = link;
  imageElement.alt = name;
  imageCaption.textContent = name;
  openModalWindow(imageModalWindow);
};

const handleProfileFormSubmit = (evt) => {
  evt.preventDefault();
  setButtonText(profileForm, true, "Сохранение...");
  setUserInfo({
    name: profileTitleInput.value,
    about: profileDescriptionInput.value,
  })
    .then((userData) => {
      profileTitle.textContent = userData.name;
      profileDescription.textContent = userData.about;
      closeModalWindow(profileFormModalWindow);
    })
    .catch((err) => {
      logApiError(err);
    })
    .finally(() => {
      setButtonText(profileForm, false, "Сохранение...");
    });
};

const handleAvatarFromSubmit = (evt) => {
  evt.preventDefault();
  setButtonText(avatarForm, true, "Сохранение...");
  setUserAvatar(avatarInput.value)
    .then((userData) => {
      profileAvatar.style.backgroundImage = `url(${userData.avatar})`;
      closeModalWindow(avatarFormModalWindow);
      avatarForm.reset();
    })
    .catch((err) => {
      logApiError(err);
    })
    .finally(() => {
      setButtonText(avatarForm, false, "Сохранение...");
    });
};

const handleCardFormSubmit = (evt) => {
  evt.preventDefault();
  setButtonText(cardForm, true, "Создание...");
  addCard({
    name: cardNameInput.value,
    link: cardLinkInput.value,
  })
    .then((cardData) => {
      placesWrap.prepend(
        createCardElement(cardData, {
          onPreviewPicture: handlePreviewPicture,
          onLikeIcon: handleLikeClick,
          onDeleteCard: handleDeleteClick,
          onInfoClick: handleInfoClick,
          currentUserId,
        })
      );
      closeModalWindow(cardFormModalWindow);
      cardForm.reset();
      clearValidation(cardForm, validationSettings);
    })
    .catch((err) => {
      logApiError(err);
    })
    .finally(() => {
      setButtonText(cardForm, false, "Создание...");
    });
};

const handleLikeClick = ({ cardId, isLiked, likeButton, likeCountElement }) => {
  changeLikeCardStatus(cardId, isLiked)
    .then((cardData) => {
      likeButton.classList.toggle(
        "card__like-button_is-active",
        cardData.likes.some((user) => user._id === currentUserId)
      );
      likeCountElement.textContent = cardData.likes.length;
    })
    .catch((err) => {
      logApiError(err);
    });
};

const handleDeleteClick = ({ cardId, cardElement }) => {
  if (!removeCardModalWindow) {
    return;
  }
  cardToDeleteData = { cardId, cardElement };
  openModalWindow(removeCardModalWindow);
};

const handleConfirmDeleteSubmit = (evt) => {
  evt.preventDefault();
  if (!cardToDeleteData) {
    return;
  }
  if (!removeCardForm) {
    return;
  }

  setButtonText(removeCardForm, true, "Удаление...");
  deleteCardRequest(cardToDeleteData.cardId)
    .then(() => {
      cardToDeleteData.cardElement.remove();
      cardToDeleteData = null;
      closeModalWindow(removeCardModalWindow);
    })
    .catch((err) => {
      logApiError(err);
    })
    .finally(() => {
      setButtonText(removeCardForm, false, "Удаление...");
    });
};

const handleInfoClick = (cardId) => {
  if (!cardInfoModalWindow || !cardInfoTitle || !cardInfoList || !cardInfoText || !cardInfoUsersList) {
    return;
  }
  getCardList()
    .then((cards) => {
      const cardData = cards.find((card) => card._id === cardId);
      if (!cardData) {
        return;
      }

      cardInfoTitle.textContent = "Информация о карточке";
      cardInfoList.innerHTML = "";
      cardInfoUsersList.innerHTML = "";

      const infoRows = [
        createInfoString("Описание:", cardData.name),
        createInfoString("Дата создания:", formatDate(new Date(cardData.createdAt))),
        createInfoString("Владелец:", cardData.owner.name),
        createInfoString("Количество лайков:", cardData.likes.length),
      ].filter(Boolean);
      cardInfoList.append(...infoRows);

      cardInfoText.textContent = "Лайкнули:";
      cardData.likes.forEach((userData) => {
        const badgeElement = createLikedUserBadge(userData.name);
        if (badgeElement) {
          cardInfoUsersList.append(badgeElement);
        }
      });

      openModalWindow(cardInfoModalWindow);
    })
    .catch((err) => {
      logApiError(err);
    });
};

// EventListeners
profileForm.addEventListener("submit", handleProfileFormSubmit);
cardForm.addEventListener("submit", handleCardFormSubmit);
avatarForm.addEventListener("submit", handleAvatarFromSubmit);
if (removeCardForm) {
  removeCardForm.addEventListener("submit", handleConfirmDeleteSubmit);
}

openProfileFormButton.addEventListener("click", () => {
  profileTitleInput.value = profileTitle.textContent;
  profileDescriptionInput.value = profileDescription.textContent;
  clearValidation(profileForm, validationSettings);
  openModalWindow(profileFormModalWindow);
});

profileAvatar.addEventListener("click", () => {
  avatarForm.reset();
  clearValidation(avatarForm, validationSettings);
  openModalWindow(avatarFormModalWindow);
});

openCardFormButton.addEventListener("click", () => {
  cardForm.reset();
  clearValidation(cardForm, validationSettings);
  openModalWindow(cardFormModalWindow);
});

Promise.all([getCardList(), getUserInfo()])
  .then(([cardsData, userData]) => {
    currentUserId = userData._id;
    profileTitle.textContent = userData.name;
    profileDescription.textContent = userData.about;
    profileAvatar.style.backgroundImage = `url(${userData.avatar})`;

    cardsData.forEach((cardData) => {
      placesWrap.append(
        createCardElement(cardData, {
          onPreviewPicture: handlePreviewPicture,
          onLikeIcon: handleLikeClick,
          onDeleteCard: handleDeleteClick,
          onInfoClick: handleInfoClick,
          currentUserId,
        })
      );
    });
  })
  .catch((err) => {
    logApiError(err);
    showConnectionError();
  });

enableValidation(validationSettings);

clearValidation(profileForm, validationSettings);
clearValidation(cardForm, validationSettings);
clearValidation(avatarForm, validationSettings);

//настраиваем обработчики закрытия попапов
const allPopups = document.querySelectorAll(".popup");
allPopups.forEach((popup) => {
  setCloseModalWindowEventListeners(popup);
});
