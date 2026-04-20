{
  inputs = {
    nixpkgs.url = "github:nixos/nixpkgs/nixos-unstable";
  };

  outputs = {...} @ inputs: let
    supportedSystems = ["x86_64-linux"];
    forEachSupportedSystem = f:
      inputs.nixpkgs.lib.genAttrs supportedSystems (system:
        f {
          pkgs = import inputs.nixpkgs {
            inherit system;
            overlays = [
              inputs.self.overlays.default
            ];
          };
        });
  in {
    overlays.default = final: prev: rec {
      nodejs = prev.nodejs;
      pnpm = prev.pnpm.override {inherit nodejs;};
    };

    devShells = forEachSupportedSystem ({pkgs}: {
      default = pkgs.mkShell {
        packages = with pkgs; [
          nodejs
          pnpm
        ];
      };
    });
  };
}
