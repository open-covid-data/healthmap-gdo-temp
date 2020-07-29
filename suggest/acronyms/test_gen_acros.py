import unittest
import os
import tempfile

import gen_acros

class TestGenerator(unittest.TestCase):

    def test_generate_acronyms(self):
        with tempfile.TemporaryDirectory() as tmpdirname:
            filePath = os.path.join(tmpdirname, "input_file.txt")
            with open(filePath, "w") as f:
                # OK
                f.write("first line\n")
                # Non alphanumeric
                f.write("2nd line\n")
                # OK
                f.write("Third time is a charm\n")
                # Empty line
                f.write("\n")
                # Profanity: ASS
                f.write("All Success is Sure\n")
        
            gen_acros.AcronymGenerator().Generate(filePath)

            with open(filePath, "r") as f:
                self.assertEqual(f.readlines(), [
                    "2nd line\n",
                    "All Success is Sure\n",
                    "Third time is a charm (TTC)\n",
                    "first line (FL)\n",
                ])