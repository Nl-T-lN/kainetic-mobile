import re

file_path = "node_modules/react-native-track-player/android/src/main/java/com/doublesymmetry/trackplayer/module/MusicModule.kt"

with open(file_path, "r") as f:
    content = f.read()

# Fix Bundle? vs Bundle
content = content.replace(
    "callback.resolve(Arguments.fromBundle(musicService.tracks[index].originalItem))",
    "callback.resolve(musicService.tracks[index].originalItem?.let { Arguments.fromBundle(it) })"
)
content = content.replace(
    "Arguments.fromBundle(\n                musicService.tracks[musicService.getCurrentTrackIndex()].originalItem\n            )",
    "musicService.tracks[musicService.getCurrentTrackIndex()].originalItem?.let { Arguments.fromBundle(it) }"
)

# Fix TurboModule return type by removing `= scope.launch {`
# We will use regex to find the method signature and the block.
# Since kotlin methods with `= scope.launch { ... }` have exactly one expression body, 
# and in MusicModule.kt they all look like:
#     @ReactMethod
#     fun skip(index: Int, initialTime: Float, callback: Promise) = scope.launch {
#         ...
#     }
# We can replace `= scope.launch {` with `{ scope.launch {` and then add an extra `}` at the end of the block.
# Wait! Instead of regex parsing braces, we can just replace `@ReactMethod\n    fun` with `@ReactMethod(isBlockingSynchronousMethod = false)\n    fun`?
# NO, TurboModules still requires the return type to be `void`.
# What if we just do:
#     @ReactMethod
#     fun skip(index: Int, initialTime: Float, callback: Promise) { scope.launch {
#     ...
#     } }
# How to find the matching closing brace?

def patch_methods(text):
    lines = text.split('\n')
    out = []
    i = 0
    while i < len(lines):
        line = lines[i]
        match = re.search(r'^(\s+)fun\s+\w+\(.*?\)\s*=\s*scope\.launch\s*\{', line)
        if match:
            # We found a method!
            indent = match.group(1)
            line = line.replace("= scope.launch {", "{ scope.launch {")
            out.append(line)
            
            # Now we need to find the matching closing brace for this launch block
            brace_count = 1
            i += 1
            while i < len(lines) and brace_count > 0:
                inner_line = lines[i]
                out.append(inner_line)
                brace_count += inner_line.count('{')
                brace_count -= inner_line.count('}')
                i += 1
            
            # The loop finishes when brace_count == 0, meaning we just appended the closing brace of scope.launch.
            # Now we need to add the closing brace for the function itself.
            out.append(indent + "}")
            continue
            
        out.append(line)
        i += 1
    return '\n'.join(out)

content = patch_methods(content)

with open(file_path, "w") as f:
    f.write(content)
print("Patched MusicModule.kt successfully!")
