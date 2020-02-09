#include <cstddef>
#include <vector>
#include <sstream>
#include <nan.h>
#include <windows.h>
#include <Shlobj.h>
#include "lodepng.h"
// with line number
#define STRING2(x) #x
#define STRING(x) STRING2(x)

#pragma message("NODE_MODULE_VERSION: " STRING(NODE_MODULE_VERSION))


static const std::string base64_chars =
"ABCDEFGHIJKLMNOPQRSTUVWXYZ"
"abcdefghijklmnopqrstuvwxyz"
"0123456789+/";
std::string base64_encode(unsigned char const* bytes_to_encode, unsigned int in_len) {
    std::ostringstream ret;
    int i = 0;
    int j = 0;
    unsigned char char_array_3[3];
    unsigned char char_array_4[4];

    while (in_len--) {
        char_array_3[i++] = *(bytes_to_encode++);
        if (i == 3) {
            char_array_4[0] = (char_array_3[0] & 0xfc) >> 2;
            char_array_4[1] = ((char_array_3[0] & 0x03) << 4) + ((char_array_3[1] & 0xf0) >> 4);
            char_array_4[2] = ((char_array_3[1] & 0x0f) << 2) + ((char_array_3[2] & 0xc0) >> 6);
            char_array_4[3] = char_array_3[2] & 0x3f;

            for (i = 0; (i < 4); i++)
                ret << base64_chars[char_array_4[i]];
            i = 0;
        }
    }

    if (i)
    {
        for (j = i; j < 3; j++)
            char_array_3[j] = '\0';

        char_array_4[0] = (char_array_3[0] & 0xfc) >> 2;
        char_array_4[1] = ((char_array_3[0] & 0x03) << 4) + ((char_array_3[1] & 0xf0) >> 4);
        char_array_4[2] = ((char_array_3[1] & 0x0f) << 2) + ((char_array_3[2] & 0xc0) >> 6);

        for (j = 0; (j < i + 1); j++)
            ret << base64_chars[char_array_4[j]];

        while ((i++ < 3))
            ret << '=';

    }

    return ret.str();

}


void getIcon(const Nan::FunctionCallbackInfo<v8::Value> &args)
{
    v8::Isolate* isolate = args.GetIsolate();
    v8::String::Utf8Value str(isolate, args[0]);
    std::string s(*str);
    SHFILEINFOW info;

    std::wstring ws(s.size(), L' '); // Overestimate number of code points.
    ws.resize(std::mbstowcs(&ws[0], s.c_str(), s.size())); // Shrink to fit.
    SHGetFileInfoW(ws.c_str(), FILE_ATTRIBUTE_NORMAL, &info, sizeof(info),
        SHGFI_ICON | SHGFI_USEFILEATTRIBUTES | SHGFI_LARGEICON);
    ICONINFO stIconInfo;
    GetIconInfo(info.hIcon, &stIconInfo);
    HBITMAP hBmp = stIconInfo.hbmColor;
    BITMAP bitmap;
    GetObject(hBmp, sizeof(bitmap), (LPVOID)&bitmap);
    std::vector<uint8_t> bmpBytes(bitmap.bmHeight * bitmap.bmWidthBytes);
    GetBitmapBits(hBmp, bmpBytes.size(), bmpBytes.data());
    DestroyIcon(info.hIcon);


    std::vector<uint8_t> bmpRealBytes(bitmap.bmWidth * bitmap.bmHeight * 4);
    const size_t comp = bitmap.bmBitsPixel / 8;
    const size_t total = bitmap.bmWidth * bitmap.bmHeight * 4;
    for (size_t i = 0; i < total; i += comp)
    {
        bmpRealBytes[i + 0] = bmpBytes[i + 2];
        bmpRealBytes[i + 1] = bmpBytes[i + 1];
        bmpRealBytes[i + 2] = bmpBytes[i + 0];
        if (comp == 4)
            bmpRealBytes[i + 3] = bmpBytes[i + 3];
    }

    std::vector<uint8_t> pngBytes;
    lodepng::encode(pngBytes, bmpRealBytes, bitmap.bmWidth, bitmap.bmHeight);

    args.GetReturnValue().Set(Nan::New(base64_encode(pngBytes.data(), pngBytes.size())).ToLocalChecked());
}
void openWith(const Nan::FunctionCallbackInfo<v8::Value> &args)
{
    //http://www.cplusplus.com/forum/windows/57419/
    v8::Isolate* isolate = args.GetIsolate();
    v8::String::Utf8Value str(isolate, args[0]);
    std::string pathToFile(*str);
    std::wstring pathToFileW;
    
    int t=MultiByteToWideChar(CP_UTF8, 0, *str, str.length(), nullptr, 0);
    pathToFileW.resize(t);
    MultiByteToWideChar(CP_UTF8, 0, *str, str.length(), &pathToFileW[0], pathToFileW.size());

    OPENASINFO Info = { 0 };
    ZeroMemory(&Info, sizeof(OPENASINFO));
    Info.pcszFile = pathToFileW.c_str();
    Info.pcszClass = NULL;
    Info.oaifInFlags = OAIF_EXEC;
    SHOpenWithDialog(NULL, &Info);
}

void Init(v8::Local<v8::Object> exports)
{
    v8::Local<v8::Context> context = exports->CreationContext();
    exports->Set(context,
                 Nan::New("geticon").ToLocalChecked(),
                 Nan::New<v8::FunctionTemplate>(getIcon)
                     ->GetFunction(context)
                     .ToLocalChecked());
    exports->Set(context,
                 Nan::New("openWith").ToLocalChecked(),
                 Nan::New<v8::FunctionTemplate>(openWith)
                     ->GetFunction(context)
                     .ToLocalChecked());
}

NODE_MODULE(internal_module, Init)