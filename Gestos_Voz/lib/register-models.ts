/**
 * Registra modelos Mongoose (necesario antes de .populate("contentId")).
 */
import Content from "@/models/Content"
import Faq from "@/models/Faq"
import Notification from "@/models/Notification"
import Totem from "@/models/Totem"

export { Content, Totem, Notification, Faq }
