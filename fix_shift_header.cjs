const fs = require('fs');

const filename = 'src/pages/ShiftSchedule.tsx';
let content = fs.readFileSync(filename, 'utf8');

// Hide legend on lg instead of md
content = content.replace(/<div className="hidden md:flex flex-wrap gap-2 text-xs">/g, '<div className="hidden lg:flex flex-wrap gap-2 text-xs">');

// Make Month title smaller
content = content.replace(/<h2 className="text-lg font-bold text-gray-800 w-32 text-center">/g, '<h2 className="text-base md:text-lg font-bold text-gray-800 w-auto px-2 text-center">');

// Change sm:inline to lg:inline for the 3 buttons
content = content.replace(/<span className="hidden sm:inline">Nh.p Excel<\/span>/g, '<span className="hidden lg:inline">Nhập Excel</span>');
content = content.replace(/<span className="hidden sm:inline">..?ng b. NS<\/span>/g, '<span className="hidden lg:inline">Đồng bộ NS</span>');
content = content.replace(/<span className="hidden sm:inline">H.y thay ..i<\/span>/g, '<span className="hidden lg:inline">Hủy thay đổi</span>');

// Wrap "Lưu thay đổi" in a span
content = content.replace(/Lưu thay đổi\s*<\/button>/g, '<span className="hidden lg:inline">Lưu thay đổi</span>\n                  </button>');
// Wait, my node regex for "Lưu thay đổi" might not match due to encoding if I use literal characters.
// Let's replace the whole button content using a more robust regex:
content = content.replace(/<Save className="w-4 h-4 mr-1.5" \/>\}\s*Lư.*?i\s*<\/button>/g, '<Save className="w-4 h-4 lg:mr-1.5" />}\n                    <span className="hidden lg:inline">Lưu thay đổi</span>\n                  </button>');

// Also need to remove margin-right from icons if text is hidden.
content = content.replace(/sm:mr-1.5/g, 'lg:mr-1.5');

// In case "Lưu thay đổi" wasn't caught:
content = content.replace(/mr-1.5" \/>\}\s*Lư.*?i/g, 'lg:mr-1.5" />}\n                    <span className="hidden lg:inline">Lưu thay đổi</span>');

fs.writeFileSync(filename, content, 'utf8');
console.log('Fixed ShiftSchedule header buttons and legend');
