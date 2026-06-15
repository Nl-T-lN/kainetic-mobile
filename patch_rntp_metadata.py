import re

file_path = "node_modules/react-native-track-player/android/src/main/java/com/doublesymmetry/trackplayer/module/MusicModule.kt"

with open(file_path, "r") as f:
    content = f.read()

def patch_methods(text):
    # Regex to find `fun name(...) =\n        scope.launch {`
    # We will replace it with `fun name(...) { scope.launch {`
    # And then we need to add a closing brace.
    lines = text.split('\n')
    out = []
    i = 0
    while i < len(lines):
        line = lines[i]
        
        # Check if the line ends with =
        match = re.search(r'^(\s+)fun\s+updateMetadataForTrack\(.*?=\s*', line)
        if match:
            indent = match.group(1)
            # Remove the = from this line
            line = line.replace("=", "{")
            out.append(line)
            
            i += 1
            # Next line should be scope.launch {
            inner_line = lines[i]
            out.append(inner_line)
            
            # Now track braces to find the end of scope.launch
            brace_count = 1
            i += 1
            while i < len(lines) and brace_count > 0:
                inner_line = lines[i]
                out.append(inner_line)
                brace_count += inner_line.count('{')
                brace_count -= inner_line.count('}')
                i += 1
                
            out.append(indent + "}")
            continue
            
        out.append(line)
        i += 1
    return '\n'.join(out)

content = patch_methods(content)

with open(file_path, "w") as f:
    f.write(content)
print("Patched updateMetadataForTrack successfully!")
