using System;
using System.Collections.Generic;

namespace EspFlasher.Entities;

public partial class Factory
{
    public int Id { get; set; }

    public string Name { get; set; } = null!;

    public DateTime? CreatedAt { get; set; }

    public virtual ICollection<Conveyor> Conveyors { get; set; } = new List<Conveyor>();

    public virtual ICollection<User> Users { get; set; } = new List<User>();
}
