/**
 * data.js
 * Dữ liệu tĩnh: Trích dẫn Kinh Pháp Cú (Dhammapada)
 * Mỗi object gồm: id, pham (tên phẩm), ke_ngon (kệ ngôn), y_nghia (ý nghĩa)
 */

const PHAP_CU = [
  {
    id: 1,
    pham: "Phẩm Song Yếu — Kệ 1",
    ke_ngon:
      "Tâm dẫn đầu mọi pháp,\nTâm chủ, tâm tạo tác.\nNếu nói hay hành động\nVới tâm ý ô nhiễm,\nKhổ não sẽ theo ta,\nNhư bánh xe theo chân bò.",
    y_nghia:
      "Mọi hành động của thân, khẩu, ý đều bắt nguồn từ tâm. Khi tâm bị si mê, tham ái dẫn dắt, hậu quả khổ đau sẽ theo ta không rời — như bánh xe lăn theo dấu chân bò mãi không dứt.",
  },
  {
    id: 2,
    pham: "Phẩm Song Yếu — Kệ 2",
    ke_ngon:
      "Tâm dẫn đầu mọi pháp,\nTâm chủ, tâm tạo tác.\nNếu nói hay hành động\nVới tâm ý thanh tịnh,\nAn lạc sẽ theo ta,\nNhư bóng chẳng rời hình.",
    y_nghia:
      "Ngược lại, khi tâm trong sáng, không nhiễm ô, mỗi lời nói và hành động đều gieo hạt giống an vui. Hạnh phúc sẽ bám theo ta như bóng không rời hình — tự nhiên và bền vững.",
  },
  {
    id: 3,
    pham: "Phẩm Tâm — Kệ 33",
    ke_ngon:
      "Tâm dao động, bất định,\nKhó hộ trì, khó điều phục.\nBậc trí uốn nắn tâm,\nNhư thợ làm thẳng tên.",
    y_nghia:
      "Tâm ta vốn bất định, phóng túng như con ngựa hoang. Nhưng người trí biết rằng tu tập là công việc của cả đời — kiên nhẫn uốn nắn tâm như người thợ lành nghề nắn mũi tên cho thẳng.",
  },
  {
    id: 4,
    pham: "Phẩm Hoa — Kệ 49",
    ke_ngon:
      "Như ong hút mật hoa,\nKhông hại sắc hương hoa,\nBậc Mâu Ni vào làng,\nÁnh mắt chẳng ngó nhìn.",
    y_nghia:
      "Bậc tu hành sống giữa cuộc đời như ong lấy mật — nhận những gì cần thiết mà không gây tổn hại, không vì tham ái mà làm tổn thương ai, không để cảnh bên ngoài kéo tâm vào dính mắc.",
  },
  {
    id: 5,
    pham: "Phẩm Ngàn — Kệ 100",
    ke_ngon:
      "Dù nói ngàn lời lẽ,\nNhưng không gì lợi ích,\nTốt hơn một câu nghĩa,\nNghe xong, tâm tịnh an.",
    y_nghia:
      "Ngàn lời rỗng tuếch không bằng một câu chân thật có trí tuệ. Trên con đường tu học, phẩm chất quan trọng hơn số lượng. Một điều hiểu thấu còn giá trị hơn vạn điều nghe qua tai mà lòng không chuyển.",
  },
  {
    id: 6,
    pham: "Phẩm Già — Kệ 153",
    ke_ngon:
      "Lang thang bao kiếp sống,\nTa tìm nhưng chẳng gặp,\nKẻ xây dựng ngôi nhà.\nKhổ thay, đời tái sanh!",
    y_nghia:
      "Đây là lời Đức Phật thốt lên khi chứng ngộ dưới cội Bồ Đề. \"Ngôi nhà\" ám chỉ bản ngã (tự ngã), \"người thợ xây\" là tham ái. Khi thấy rõ gốc rễ khổ đau, vòng luân hồi mới được cởi bỏ.",
  },
  {
    id: 7,
    pham: "Phẩm Ác — Kệ 117",
    ke_ngon:
      "Nếu người làm điều ác,\nĐừng tiếp tục làm nữa.\nĐừng ưa thích điều ác,\nVì chứa chấp khổ đau.",
    y_nghia:
      "Ai cũng có thể phạm lỗi. Điều quan trọng không phải là chưa từng làm sai, mà là biết dừng lại khi nhận ra. Không nuôi dưỡng ác pháp trong tâm — đó là bước đầu của sự chuyển hóa.",
  },
  {
    id: 8,
    pham: "Phẩm Thiện — Kệ 118",
    ke_ngon:
      "Nếu người làm điều lành,\nHãy tiếp tục làm nữa.\nHãy ưa thích điều lành,\nVì chứa chấp an vui.",
    y_nghia:
      "Thiện pháp cần được vun trồng mỗi ngày, không ngừng nghỉ. Như ngọn lửa cần được thêm củi, tâm thiện lành cần được nuôi dưỡng liên tục bằng những hành động, lời nói và suy nghĩ trong sáng.",
  },
  {
    id: 9,
    pham: "Phẩm Đạo — Kệ 183",
    ke_ngon:
      "Không làm mọi điều ác,\nThành tựu các hạnh lành,\nTâm ý giữ trong sạch:\nChính lời chư Phật dạy.",
    y_nghia:
      "Đây là cốt lõi giáo lý của mọi vị Phật: lánh dữ, làm lành, và thanh lọc tâm. Ba điều này tuy giản dị nhưng là cả con đường giải thoát — không thừa, không thiếu.",
  },
  {
    id: 10,
    pham: "Phẩm Phật Đà — Kệ 183",
    ke_ngon:
      "Hãy tự mình thắp đuốc\nMà đi, hãy nỗ lực,\nHãy tự mình tinh tấn.\nLà bến đỗ an toàn.",
    y_nghia:
      "Lời Đức Phật nhắn nhủ trước lúc nhập diệt: mỗi người là ngọn đèn của chính mình. Không ai có thể giác ngộ thay ta. Hãy tinh tấn, hãy tỉnh thức — chính ta là chỗ nương tựa vững chắc nhất.",
  },
  {
    id: 11,
    pham: "Phẩm Vui — Kệ 197",
    ke_ngon:
      "Hạnh phúc thay, chúng ta sống,\nKhông thù, giữa các thù hận!\nGiữa những người thù hận,\nTa sống không thù hận.",
    y_nghia:
      "Không phải vắng mặt kẻ thù mà tạo ra bình yên — mà là tâm không mang thù hận. Sống giữa thế giới đầy xung đột với trái tim không hận thù là bài học cao quý nhất của từ bi.",
  },
  {
    id: 12,
    pham: "Phẩm Ái Dục — Kệ 214",
    ke_ngon:
      "Từ ái dục sinh ưu,\nTừ ái dục sinh sợ.\nAi giải thoát ái dục,\nKhông ưu, đâu có sợ.",
    y_nghia:
      "Mọi nỗi lo âu và sợ hãi đều bắt nguồn từ sự dính mắc. Khi ta yêu thứ gì quá mức, ta sợ mất nó. Buông bỏ không có nghĩa là hờ hững — mà là yêu thương với trái tim rộng mở, không nắm giữ.",
  },
  {
    id: 13,
    pham: "Phẩm Tỳ Kheo — Kệ 362",
    ke_ngon:
      "Ai nhiếp phục được tay,\nAi nhiếp phục được chân,\nAi nhiếp phục được lời,\nVị tối thượng tự chế.",
    y_nghia:
      "Giới luật bắt đầu từ ba cửa: thân (tay, chân), khẩu (lời nói), và cuối cùng là ý (tâm). Người tự chủ được cả ba là bậc cao thượng, dù không mang danh hiệu hay địa vị gì.",
  },
  {
    id: 14,
    pham: "Phẩm Bà La Môn — Kệ 396",
    ke_ngon:
      "Không phải do búi tóc,\nKhông phải do dòng giống,\nKhông phải do sanh chủng:\nLàm Bà La Môn thật.",
    y_nghia:
      "Phật dạy rằng giai cấp, dòng tộc, hay ngoại hình không quyết định phẩm giá con người. Chỉ tâm trong sạch, hành động đúng đắn mới thật sự nâng cao phẩm cách — giáo lý bình đẳng vượt thời đại.",
  },
];
