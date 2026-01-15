font_map = [
  "A",
  "B",
  "C",
  "D",
  "E",
  "F",
  "G",
  "H",
  "I",
  "J",
  "K",
  "L",
  "M",
  "N",
  "O",
  "P",
  "Q",
  "R",
  "S",
  "T",
  "U",
  "V",
  "W",
  "X",
  "Y",
  "Z",
  "0",
  "1",
  "2",
  "3",
  "4",
  "5",
  "6",
  "7",
  "8",
  "9",
  ":",
  "*",
  ".",
  "%",
  "^",
  "Á",
  "À",
  "É",
  "È",
  "Í",
  "Ì",
  "Ó",
  "Ò",
  "Ö",
  "Ú",
  "Ù",
  "$",
  "!",
  "?",
  ",",
  "Ñ",
  "¿",
  "/"
];

function print_text(string_text, x, y,context = ctx) {

    for (let i = 0; i < string_text.length; i++) {
      context.drawImage(
        font_img,
        font_map.indexOf(string_text[i].toUpperCase()) * 10,
        0,
        10,
        10,
        x + i * 10,
        y,
        10,
        10
      );
    }
  }

  function print_title(string_text, x, y, size = 30, context = ctx) {
      ry =2* Math.random()
      height = 60
      if (string_text.length > 15){
        //alert("a")
        size = parseInt(510/string_text.length) 
        height = parseInt((size/30)*60)
      }
      //context.fillStyle = "black";
      //context.fillRect(x-90, ry+y-25, 900, 60);
    for (let i = 0; i < string_text.length; i++) {
      let charX = x + i * size;
      let charY = y;

            context.drawImage(
        font_img,
        font_map.indexOf(string_text[i].toUpperCase()) * 10,
        0,
        10,
        10,
        parseInt(charX),
        parseInt(charY),
        size,
        size
      );
    }
   // print_text("capitulo 3",x,y-20-ry,context)
  }
  



  function print_text_dialog(string_text, x, y, context = ctx) {
    let current_x = x;
    let current_y = y;
    let line_chars = 0;
  
    for (let i = 0; i < string_text.length; i++) {
      // If current character is a space, check if next word fits
      if (string_text[i] === ' ') {
        let next_word_length = 0;
        let j = i + 1;
        while (j < string_text.length && string_text[j] !== ' ') {
          next_word_length++;
          j++;
        }
  
        // If next word doesn't fit, start a new line
        if (line_chars + next_word_length >= dialog_size) {
          current_y += 10;
          current_x = x;
          line_chars = 0;
          line_start = i + 1;
        }
      }
  
      context.drawImage(
        font_img,
        font_map.indexOf(string_text[i].toUpperCase()) * 10,
        0,
        10,
        10,
        current_x + (line_chars * 10),
        current_y,
        10,
        10
      );
  
      line_chars++;
    }
  }